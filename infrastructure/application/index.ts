"use strict";

import * as fsWalk from "@nodelib/fs.walk";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as cloudflare from "@pulumi/cloudflare";
import * as pulumi from "@pulumi/pulumi";
import * as mime from "mime";
import * as tldjs from "tldjs";

const config = new pulumi.Config();

const env = pulumi.getStack();
const certificates = new pulumi.StackReference(`planx/certificates/${env}`);
const networking = new pulumi.StackReference(`planx/networking/${env}`);
const data = new pulumi.StackReference(`planx/data/${env}`);

// The @pulumi/cloudflare package doesn't generate errors so this is here just to create a warning in case the CloudFlare API token is missing.
new pulumi.Config("cloudflare").require("apiToken");

(async function main() {
  const DOMAIN = await certificates.requireOutputValue("domain");

  const repo = new awsx.ecr.Repository("repo");

  const vpc = awsx.ec2.Vpc.fromExistingIds("vpc", {
    vpcId: networking.requireOutput("vpcId"),
  });
  const cluster = new awsx.ecs.Cluster("cluster", {
    cluster: networking.requireOutput("clusterName"),
    vpc,
  });

  // ----------------------- Metabase
  const lbMetabase = new awsx.lb.ApplicationLoadBalancer("metabase", {
    external: true,
    vpc: vpc,
    subnets: networking.requireOutput("publicSubnetIds"),
  });
  // XXX: If you change the port, you'll have to make the security group accept incoming connections on the new port
  const METABASE_PORT = 3000;
  const targetMetabase = lbMetabase.createTargetGroup("metabase", {
    port: METABASE_PORT,
    protocol: "HTTP",
    healthCheck: {
      path: "/api/health",
    },
  });
  // Forward HTTP to HTTPS
  const metabaseListenerHttp = targetMetabase.createListener("metabase-http", {
    protocol: "HTTP",
    defaultAction: {
      type: "redirect",
      redirect: {
        protocol: "HTTPS",
        port: "443",
        statusCode: "HTTP_301",
      },
    },
  });
  const metabaseListenerHttps = targetMetabase.createListener(
    "metabase-https",
    {
      protocol: "HTTPS",
      certificateArn: certificates.requireOutput("certificateArn"),
    }
  );
  const metabaseService = new awsx.ecs.FargateService("metabase", {
    cluster,
    subnets: networking.requireOutput("publicSubnetIds"),
    taskDefinitionArgs: {
      container: {
        image: "metabase/metabase:v0.41.2",
        memory: 2048 /*MB*/,
        portMappings: [metabaseListenerHttps],
        environment: [
          { name: "MB_DB_TYPE", value: "postgres" },
          {
            name: "MB_DB_CONNECTION_URI",
            value: data.requireOutputValue("dbRootUrl"),
          },
          { name: "MB_JETTY_PORT", value: String(METABASE_PORT) },
          {
            name: "MB_SITE_URL",
            value: pulumi.interpolate`https://metabase.${DOMAIN}/`,
          },
          // https://www.metabase.com/docs/latest/operations-guide/encrypting-database-details-at-rest.html
          {
            name: "MB_ENCRYPTION_SECRET_KEY",
            value: config.require("metabase-encryption-secret-key"),
          },
        ],
      },
    },
    desiredCount: 1,
    // Metabase takes a while to boot up
    healthCheckGracePeriodSeconds: 60 * 15,
  });

  new cloudflare.Record("metabase", {
    name: tldjs.getSubdomain(DOMAIN)
      ? `metabase.${tldjs.getSubdomain(DOMAIN)}`
      : "metabase",
    type: "CNAME",
    zoneId: config.require("cloudflare-zone-id"),
    value: metabaseListenerHttps.endpoint.hostname,
    ttl: 1,
    proxied: false,
  });

  // ----------------------- Hasura
  const lbHasura = new awsx.lb.ApplicationLoadBalancer("hasura", {
    external: true,
    vpc: vpc,
    subnets: networking.requireOutput("publicSubnetIds"),
  });
  // XXX: If you change the port, you'll have to make the security group accept incoming connections on the new port
  const HASURA_PORT = 80;
  const targetHasura = lbHasura.createTargetGroup("hasura", {
    port: HASURA_PORT,
    protocol: "HTTP",
    healthCheck: {
      path: "/healthz",
    },
  });
  // Forward HTTP to HTTPS
  const hasuraListenerHttp = targetHasura.createListener("hasura-http", {
    protocol: "HTTP",
    defaultAction: {
      type: "redirect",
      redirect: {
        protocol: "HTTPS",
        port: "443",
        statusCode: "HTTP_301",
      },
    },
  });
  const hasuraListenerHttps = targetHasura.createListener("hasura-https", {
    protocol: "HTTPS",
    certificateArn: certificates.requireOutput("certificateArn"),
  });
  const hasuraService = new awsx.ecs.FargateService("hasura", {
    cluster,
    subnets: networking.requireOutput("publicSubnetIds"),
    taskDefinitionArgs: {
      container: {
        image: repo.buildAndPushImage("../../hasura.planx.uk"),
        memory: 512 /*MB*/,
        portMappings: [hasuraListenerHttps],
        environment: [
          { name: "HASURA_GRAPHQL_SERVER_PORT", value: String(HASURA_PORT) },
          { name: "HASURA_GRAPHQL_ENABLE_CONSOLE", value: "true" },
          {
            name: "HASURA_GRAPHQL_ADMIN_SECRET",
            value: config.require("hasura-admin-secret"),
          },
          { name: "HASURA_GRAPHQL_CORS_DOMAIN", value: "*" },
          {
            name: "HASURA_GRAPHQL_ENABLED_LOG_TYPES",
            value: "startup, http-log, webhook-log, websocket-log, query-log",
          },
          {
            name: "HASURA_GRAPHQL_JWT_SECRET",
            value: pulumi.interpolate`{ "type": "HS256", "key": "${config.require(
              "jwt-secret"
            )}" }`,
          },
          { name: "HASURA_GRAPHQL_UNAUTHORIZED_ROLE", value: "public" },
          {
            name: "HASURA_GRAPHQL_DATABASE_URL",
            value: data.requireOutputValue("dbRootUrl"),
          },
        ],
      },
    },
    desiredCount: 1,
  });

  new cloudflare.Record("hasura", {
    name: tldjs.getSubdomain(DOMAIN)
      ? `hasura.${tldjs.getSubdomain(DOMAIN)}`
      : "hasura",
    type: "CNAME",
    zoneId: config.require("cloudflare-zone-id"),
    value: hasuraListenerHttps.endpoint.hostname,
    ttl: 1,
    proxied: false,
  });

  // ----------------------- API
  const apiBucket = aws.s3.Bucket.get(
    "bucket",
    data.requireOutput("apiBucketId")
  );
  const apiUser = new aws.iam.User("api-user");
  const apiUserAccessKey = new aws.iam.AccessKey("api-user-access-key", {
    user: apiUser.name,
  });
  // Grant the user access to the bucket
  new aws.iam.UserPolicy("api-user-role", {
    user: apiUser.name,
    policy: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "s3:*",
          Resource: apiBucket.arn,
        },
      ],
    },
  });
  new aws.s3.BucketPolicy("api-bucket-policy", {
    bucket: apiBucket.id,
    policy: {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "ApiWriteObject",
          Effect: "Allow",
          Principal: { AWS: [apiUser.arn] },
          // XXX: We could narrow this down to the action `PutObject`
          Action: ["s3:*"],
          Resource: [pulumi.interpolate`${apiBucket.arn}/*`],
        },
      ],
    },
  });

  const lbApi = new awsx.lb.ApplicationLoadBalancer("api", {
    external: true,
    vpc: vpc,
    subnets: networking.requireOutput("publicSubnetIds"),
  });
  // XXX: If you change the port, you'll have to make the security group accept incoming connections on the new port
  const API_PORT = 80;
  const targetApi = lbApi.createTargetGroup("api", {
    port: API_PORT,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
    },
  });
  // Forward HTTP to HTTPS
  const apiListenerHttp = targetApi.createListener("api-http", {
    protocol: "HTTP",
    defaultAction: {
      type: "redirect",
      redirect: {
        protocol: "HTTPS",
        port: "443",
        statusCode: "HTTP_301",
      },
    },
  });
  const apiListenerHttps = targetApi.createListener("api-https", {
    protocol: "HTTPS",
    certificateArn: certificates.requireOutput("certificateArn"),
  });
  const apiService = new awsx.ecs.FargateService("api", {
    cluster,
    subnets: networking.requireOutput("publicSubnetIds"),
    taskDefinitionArgs: {
      container: {
        image: repo.buildAndPushImage("../../api.planx.uk"),
        memory: 512 /*MB*/,
        portMappings: [apiListenerHttps],
        environment: [
          { name: "NODE_ENV", value: "production" },
          { name: "EDITOR_URL_EXT", value: `https://${DOMAIN}` },
          { name: "AWS_S3_REGION", value: apiBucket.region },
          { name: "AWS_ACCESS_KEY", value: apiUserAccessKey.id },
          { name: "AWS_SECRET_KEY", value: apiUserAccessKey.secret },
          {
            name: "AWS_S3_BUCKET",
            value: pulumi.interpolate`${apiBucket.bucket}`,
          },
          { name: "AWS_S3_ACL", value: "public-read" },
          {
            name: "GOOGLE_CLIENT_ID",
            value: config.require("google-client-id"),
          },
          {
            name: "GOOGLE_CLIENT_SECRET",
            value: config.require("google-client-secret"),
          },
          { name: "SESSION_SECRET", value: config.require("session-secret") },
          { name: "API_URL_EXT", value: `https://api.${DOMAIN}` },
          {
            name: "BOPS_API_ROOT_DOMAIN",
            value: config.require("bops-api-root-domain"),
          },
          { name: "BOPS_API_TOKEN", value: config.require("bops-api-token") },
          { name: "JWT_SECRET", value: config.require("jwt-secret") },
          { name: "PORT", value: String(API_PORT) },
          {
            name: "HASURA_GRAPHQL_ADMIN_SECRET",
            value: config.require("hasura-admin-secret"),
          },
          {
            name: "HASURA_GRAPHQL_URL",
            value: pulumi.interpolate`https://hasura.${DOMAIN}/v1/graphql`,
          },
          ...["BUCKINGHAMSHIRE", "LAMBETH", "SOUTHWARK"].map((authority) => ({
            name: `GOV_UK_PAY_TOKEN_${authority}`,
            value: config.require(
              `gov-uk-pay-token-${authority}`.toLowerCase()
            ),
          })),
          {
            name: "AIRBRAKE_PROJECT_ID",
            value: config.require("airbrake-project-id"),
          },
          {
            name: "AIRBRAKE_PROJECT_KEY",
            value: config.require("airbrake-project-key"),
          },
        ],
      },
    },
    desiredCount: 1,
  });
  new cloudflare.Record("api", {
    name: tldjs.getSubdomain(DOMAIN)
      ? `api.${tldjs.getSubdomain(DOMAIN)}`
      : "api",
    type: "CNAME",
    zoneId: config.require("cloudflare-zone-id"),
    value: apiListenerHttps.endpoint.hostname,
    ttl: 1,
    proxied: false,
  });

  // ----------------------- ShareDB
  const lbSharedb = new awsx.lb.ApplicationLoadBalancer("sharedb", {
    external: true,
    vpc: vpc,
    subnets: networking.requireOutput("publicSubnetIds"),
  });
  // XXX: If you change the port, you'll have to make the security group accept incoming connections on the new port
  const SHAREDB_PORT = 80;
  const targetSharedb = lbSharedb.createTargetGroup("sharedb", {
    port: SHAREDB_PORT,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
      matcher: "426", // "HTTP 426 Upgrade Required"
    },
    stickiness: {
      enabled: true,
      type: "lb_cookie",
    },
  });
  // Forward HTTP to HTTPS
  const sharedbListenerHttp = targetSharedb.createListener("sharedb-http", {
    protocol: "HTTP",
    defaultAction: {
      type: "redirect",
      redirect: {
        protocol: "HTTPS",
        port: "443",
        statusCode: "HTTP_301",
      },
    },
  });
  const sharedbListenerHttps = targetSharedb.createListener("sharedb-https", {
    protocol: "HTTPS",
    certificateArn: certificates.requireOutput("certificateArn"),
  });
  const sharedbService = new awsx.ecs.FargateService("sharedb", {
    cluster,
    subnets: networking.requireOutput("publicSubnetIds"),
    taskDefinitionArgs: {
      container: {
        image: repo.buildAndPushImage("../../sharedb.planx.uk"),
        memory: 512 /*MB*/,
        portMappings: [sharedbListenerHttps],
        environment: [
          { name: "PORT", value: String(SHAREDB_PORT) },
          {
            name: "JWT_SECRET",
            value: config.require("jwt-secret"),
          },
          {
            name: "PG_URL",
            value: data.requireOutputValue("dbRootUrl"),
          },
        ],
      },
    },
    desiredCount: 1,
  });

  const sharedbDnsRecord = new cloudflare.Record("sharedb", {
    name: tldjs.getSubdomain(DOMAIN)
      ? `sharedb.${tldjs.getSubdomain(DOMAIN)}`
      : "sharedb",
    type: "CNAME",
    zoneId: config.require("cloudflare-zone-id"),
    value: sharedbListenerHttps.endpoint.hostname,
    ttl: 1,
    proxied: false,
  });

  // ------------------- Frontend
  const frontendBucket = new aws.s3.Bucket("frontend", {
    bucket: DOMAIN,
    // TODO: can we remove these cors rules?
    corsRules: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "HEAD"],
        // TODO: Narrow down allowed origin to the domain we're using
        allowedOrigins: ["*"],
        exposeHeaders: ["ETag"],
        maxAgeSeconds: 3000,
      },
    ],
    // TODO: remove stringify
    policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${DOMAIN}/*`],
        },
      ],
    }),
    websiteDomain: DOMAIN,
    website: {
      indexDocument: "index.html",
      errorDocument: "index.html",
      // XXX: If needed we can use the `routingRules` key here to create forwardings.
    },
  });

  fsWalk
    .walkSync("../../editor.planx.uk/build/", {
      basePath: "",
      entryFilter: (e) => !e.dirent.isDirectory(),
    })
    .forEach(({ path }) => {
      const relativeFilePath = `../../editor.planx.uk/build/${path}`;
      const contentType = mime.getType(relativeFilePath) || "";
      const contentFile = new aws.s3.BucketObject(
        relativeFilePath,
        {
          key: path,
          acl: "public-read",
          bucket: frontendBucket,
          contentType,
          source: new pulumi.asset.FileAsset(relativeFilePath),
          // https://web.dev/stale-while-revalidate/
          cacheControl: contentType.includes("html")
            ? undefined
            : `max-age=${1}, stale-while-revalidate=${60 * 60 * 24}`,
        },
        {
          parent: frontendBucket,
        }
      );
    });

  const frontendDnsRecord = new cloudflare.Record("frontend", {
    name: tldjs.getSubdomain(DOMAIN) ?? "@",
    type: "CNAME",
    zoneId: config.require("cloudflare-zone-id"),
    value: frontendBucket.websiteDomain,
    ttl: 1,
    proxied: true,
  });
})();

new aws.budgets.Budget("general-budget", {
  budgetType: "COST",
  limitAmount: "300",
  limitUnit: "USD",
  timePeriodStart: "2020-05-01_00:00",
  timeUnit: "MONTHLY",
  notifications: [
    {
      comparisonOperator: "GREATER_THAN",
      notificationType: "FORECASTED",
      threshold: 100,
      thresholdType: "PERCENTAGE",
      subscriberEmailAddresses: ["devops@opensystemslab.io"],
    },
  ],
});
