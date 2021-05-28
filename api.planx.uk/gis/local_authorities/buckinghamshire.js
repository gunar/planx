require("isomorphic-fetch");

const {
  getQueryableConstraints,
  makeEsriUrl,
  bufferPoint,
} = require("../helpers.js");
const { planningConstraints } = require("./metadata/buckinghamshire.js");

// Process local authority metadata
const gisLayers = getQueryableConstraints(planningConstraints);
const articleFours = {}; // "planningConstraints.article4.records" in future

// Fetch a data layer
async function search(
  mapServer,
  featureName,
  serverIndex,
  outFields,
  geometry
) {
  const { id } = planningConstraints[featureName];

  let url = makeEsriUrl(mapServer, id, serverIndex, { outFields, geometry });

  return fetch(url)
    .then((response) => response.text())
    .then((data) => new Array(featureName, data))
    .catch((error) => {
      console.log("Error:", error);
    });
}

// For this location, iterate through our planning constraints and aggregate/format the responses
async function go(x, y, extras) {
  const point = bufferPoint(x, y, 0.05);

  try {
    const results = await Promise.all(
      Object.keys(gisLayers).map((layer) =>
        search(
          gisLayers[layer].source,
          layer,
          gisLayers[layer].serverIndex,
          gisLayers[layer].fields,
          point
        )
      )
    );

    const ob = results
      .filter(([_key, result]) => !(result instanceof Error))
      .reduce(
        (acc, [key, result]) => {
          const data = JSON.parse(result);
          const k = `${planningConstraints[key].key}`;

          try {
            if (data.features.length > 0) {
              const { attributes: properties } = data.features[0];
              acc[k] = {
                ...planningConstraints[key].pos(properties),
                value: true,
                type: "warning",
                data: properties,
              };
            } else {
              if (!acc[k]) {
                acc[k] = {
                  text: planningConstraints[key].neg,
                  value: false,
                  type: "check",
                  data: {},
                };
              }
            }
          } catch (e) {
            console.log(e);
          }

          return acc;
        },
        {
          ...Object.values(articleFours).reduce((acc, curr) => {
            acc[curr] = { value: false };
            return acc;
          }, {}),
          ...extras,
        }
      );

    ob["article4.buckinghamshire.officetoresi"] = {
      value:
        ob["article4"] &&
        ob["article4"].data &&
        ob["article4"].data.SUMMARY0 &&
        ob["article4"].data.SUMMARY0.startsWith(
          "Change of use from offices to residential"
        )
          ? true
          : false,
    };

    ob["article4.buckinghamshire.poultry"] = {
      value:
        ob["article4"] &&
        ob["article4"].data &&
        ob["article4"].data.SUMMARY0 &&
        ob["article4"].data.SUMMARY0.startsWith(
          "Certain structures used for production of poultry"
        )
          ? true
          : false,
    };

    return ob;
  } catch (e) {
    throw e;
  }
}

async function locationSearch(x, y, extras) {
  return go(x, y, extras);
}

module.exports = {
  locationSearch,
};
