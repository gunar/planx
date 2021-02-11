import "./map.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Collapse from "@material-ui/core/Collapse";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Card from "@planx/components/shared/Preview/Card";
import FormInput from "@planx/components/shared/Preview/FormInput";
import QuestionHeader from "@planx/components/shared/Preview/QuestionHeader";
import axios from "axios";
import useAxios from "axios-hooks";
import DelayedLoadingIndicator from "components/DelayedLoadingIndicator";
import capitalize from "lodash/capitalize";
import natsort from "natsort";
import { useStore } from "pages/FlowEditor/lib/store";
import type { handleSubmit } from "pages/Preview/Node";
import { parse, toNormalised } from "postcode";
import React, { useEffect, useState } from "react";
import ReactHtmlParser from "react-html-parser";
import useSWR from "swr";

import type { Address, FindProperty } from "../model";
import { DEFAULT_TITLE } from "../model";
import Map from "./Map";
import { convertOrdnanceSurveyToStandard } from "./maputils";

interface Props extends FindProperty {
  handleSubmit: handleSubmit;
}

const sorter = natsort({ insensitive: true });

export default Component;

function Component(props: Props) {
  const [address, setAddress] = useState<Address | undefined>();
  // Mock data:
  // {
  // UPRN: 200003453486,
  // team: "southwark",
  // organisation: null,
  // sao: null,
  // pao: "59",
  // street: "COBOURG ROAD",
  // town: "LONDON",
  // postcode: "SE5 0HU",
  // blpu_code: "RD04",
  // planx_description: "Terrace",
  // planx_value: "residential.dwelling.house.terrace",
  // x: 533671,
  // y: 178044,
  // }
  const [id, flow, startSession] = useStore((state) => [
    state.id,
    state.flow,
    state.startSession,
  ]);
  const { data: constraints } = useSWR(() =>
    address
      ? `https://local-authority-api.planx.uk/${address.team}?x=${address.x}&y=${address.y}`
      : null
  );

  if (!address) {
    return (
      <GetAddress
        title={props.title}
        description={props.description}
        setAddress={setAddress}
      />
    );
  } else if (constraints) {
    // const mockConstraints = {
    //   "property.c31": {
    //     value: false,
    //   },
    //   "property.landAONB": {
    //     value: false,
    //   },
    //   "property.landBroads": {
    //     value: false,
    //   },
    //   "property.landExplosivesStorage": {
    //     value: false,
    //   },
    //   "property.landNP": {
    //     value: false,
    //   },
    //   "property.landSafeguarded": {
    //     value: false,
    //   },
    //   "property.landSafetyHazard": {
    //     value: false,
    //   },
    //   "property.landSSI": {
    //     value: false,
    //   },
    //   "property.landWCA": {
    //     value: false,
    //   },
    //   "property.landWHS": {
    //     value: false,
    //   },
    //   "property.landConservation": {
    //     text: "is in a Conservation Area",
    //     description:
    //       "http://www.southwark.gov.uk/planning-and-building-control/design-and-conservation/conservation-areas?chapter=10",
    //     value: true,
    //     type: "warning",
    //     data: {
    //       Conservation_area: "Cobourg Road",
    //       Conservation_area_number: 19,
    //       More_information:
    //         "http://www.southwark.gov.uk/planning-and-building-control/design-and-conservation/conservation-areas?chapter=10",
    //     },
    //   },
    //   "property.buildingListed": {
    //     text: "is, or is within, a Grade II listed building",
    //     description:
    //       "https://geo.southwark.gov.uk/connect/analyst/Includes/Listed Buildings/SwarkLB 201.pdf",
    //     value: true,
    //     type: "warning",
    //     data: {
    //       ID: 470787,
    //       NAME: "",
    //       STREET_NUMBER: "47",
    //       STREET: "Cobourg Road",
    //       GRADE: "II",
    //       DATE_OF_LISTING: "1986-01-24",
    //       LISTING_DESCRIPTION:
    //         "https://geo.southwark.gov.uk/connect/analyst/Includes/Listed Buildings/SwarkLB 201.pdf",
    //     },
    //   },
    //   "property.landTPO": {
    //     value: false,
    //     text: "is not in a TPO (Tree Preservation Order) zone",
    //     type: "check",
    //     data: {},
    //   },
    //   "property.southwarkSunrayEstate": {
    //     value: false,
    //   },
    // };
    const { lng, lat } = convertOrdnanceSurveyToStandard(address.x, address.y);
    return (
      <PropertyInformation
        handleSubmit={() => {
          if (flow && address && constraints) {
            startSession({ passport: { data: constraints, info: address } });
            props.handleSubmit();
            // Example data:
            // {
            //   "passport": {
            //     "data": {
            //       "property.constraints.planning": [
            //         "designated.conservationArea",
            //         "listed"
            //       ]
            //     },
            //     "info": {
            //       "UPRN": 200003453486,
            //       "team": "southwark",
            //       "organisation": null,
            //       "sao": null,
            //       "pao": "59",
            //       "street": "COBOURG ROAD",
            //       "town": "LONDON",
            //       "postcode": "SE5 0HU",
            //       "blpu_code": "RD04",
            //       "planx_description": "Terrace",
            //       "planx_value": "residential.dwelling.house.terrace",
            //       "x": 533671,
            //       "y": 178044
            //     }
            //   },
            //   "breadcrumbs": {}
            // }
          } else {
            throw Error("Should not have been clickable");
          }
        }}
        lng={lng}
        lat={lat}
        // TODO: Alastair asked for Title and Description fields so perhaps keep these here for now
        title="About the property"
        description="This is the information we currently have about the property"
        propertyDetails={[
          {
            heading: "Address",
            // TODO: dry with `title`
            detail: [
              address.organisation,
              address.sao,
              [address.pao, address.street].filter(Boolean).join(" "),
              address.town,
            ]
              .filter(Boolean)
              .join(", "),
          },
          {
            heading: "Postcode",
            detail: address.postcode,
          },
          {
            heading: "District",
            detail: capitalize(address.team),
          },
          {
            heading: "Building type",
            detail: address.planx_description,
          },
          // {
          //   heading: "UPRN",
          //   detail: address.UPRN,
          // },
        ]}
        propertyConstraints={{
          title: "Constraints",
          constraints: (Object.values(constraints) || []).filter(
            ({ text }: any) => text
          ),
        }}
      />
    );
  } else {
    return (
      <DelayedLoadingIndicator msDelayBeforeVisible={0}>
        Waiting for property data…
      </DelayedLoadingIndicator>
    );
  }
}

function GetAddress(props: {
  setAddress: React.Dispatch<React.SetStateAction<Address | undefined>>;
  title?: string;
  description?: string;
}) {
  const [boundary, setBoundary] = useState(null);
  const [useMap, setUseMap] = useState<Boolean>(false);
  const [postcode, setPostcode] = useState<string | null>();
  const [sanitizedPostcode, setSanitizedPostcode] = useState<string | null>();
  const [selectedOption, setSelectedOption] = useState<Option | undefined>();

  const { data } = useSWR(
    () =>
      sanitizedPostcode
        ? // TODO: Should we add `&nocache` ?
          `https://llpg.planx.uk/addresses?limit=100&postcode=eq.${escape(
            sanitizedPostcode
          )}`
        : null
    // Example response
    //   const data = [
    //     {
    //       UPRN: 10009795450,
    //       team: "southwark",
    //       organisation: null,
    //       sao: "FIRST FLOOR AND SECOND FLOOR FLAT",
    //       pao: "47",
    //       street: "COBOURG ROAD",
    //       town: "LONDON",
    //       postcode: "SE5 0HU",
    //       blpu_code: "RD06",
    //       planx_description: "Flat",
    //       planx_value: "residential.dwelling.flat",
    //       x: 533683,
    //       y: 178083,
    //     },
    //     // ...
    //   ];
  );

  return (
    <Card
      handleSubmit={() => props.setAddress(selectedOption)}
      isValid={Boolean(selectedOption)}
    >
      <QuestionHeader
        title={props.title || DEFAULT_TITLE}
        description={props.description || ""}
      />
      {useMap ? (
        // Using map
        <Box>
          <Map
            // TODO: Why these fixed values here?
            zoom={17.5}
            lat={51.2754385}
            lng={1.0848595}
            setBoundary={(val: any) => setBoundary(val)}
          />

          {boundary && (
            <>
              <Box mb={3}>
                The boundary you have drawn is{" "}
                <strong>
                  {(boundary as any).area}m<sup>2</sup>
                </strong>
              </Box>
              <Button variant="contained" size="large" color="primary">
                Continue
              </Button>
            </>
          )}
        </Box>
      ) : (
        // Using postcode
        <>
          <Box pb={2}>
            <FormInput
              placeholder="Enter the postcode of the property"
              value={postcode || ""}
              onChange={(e: any) => {
                const input = e.target.value;
                const postcode = parse(input);
                if (postcode.valid) {
                  setSanitizedPostcode(toNormalised(input));
                  setPostcode(toNormalised(input));
                } else {
                  setSanitizedPostcode(null);
                  setPostcode(input.toUpperCase());
                }
              }}
            />
            {data && (
              <Autocomplete
                options={data
                  .map(
                    (address: Address): Option => ({
                      ...address,
                      title: [
                        address.sao,
                        [address.pao, address.street].filter(Boolean).join(" "),
                        address.town,
                      ]
                        .filter(Boolean)
                        .join(", "),
                    })
                  )
                  .sort((a: Option, b: Option) => sorter(a.title, b.title))}
                getOptionLabel={(option: Option) => option.title}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Address"
                    variant="outlined"
                    style={{ marginTop: 20 }}
                    autoFocus
                  />
                )}
                onChange={(event, selectedOption) => {
                  if (selectedOption) {
                    setSelectedOption(selectedOption);
                  }
                }}
              />
            )}
          </Box>
          {/* Map is disabled for now
            <Box pb={2} color="text.primary">
              <a
                href="!#"
                style={{ color: "inherit" }}
                onClick={(e) => {
                  e.preventDefault();
                  setUseMap(true);
                }}
              >
                Find the property on a map
              </a>
            </Box>*/}
        </>
      )}
    </Card>
  );
}

interface Option extends Address {
  title: string;
}

const useClasses = makeStyles((theme) => ({
  map: {
    padding: theme.spacing(1, 0),
  },
  constraint: {
    borderLeft: `3px solid rgba(0,0,0,0.3)`,
    padding: theme.spacing(1, 1.5),
    marginBottom: theme.spacing(0.5),
  },
  propertyDetail: {
    display: "flex",
    justifyContent: "flex-start",
    borderBottom: `1px solid ${theme.palette.background.paper}`,
  },
}));
export function PropertyInformation(props: any) {
  const {
    title,
    description,
    propertyDetails,
    propertyConstraints,
    lat,
    lng,
    handleSubmit,
  } = props;
  const styles = useClasses();
  return (
    <Card handleSubmit={handleSubmit} isValid>
      <QuestionHeader title={title} description={description} />
      <Box className={styles.map}>
        <Map zoom={18} lat={lat} lng={lng} />
        <Box color="text.secondary" textAlign="right">
          <Button variant="text" color="inherit">
            Redraw boundary
          </Button>
        </Box>
      </Box>
      <Box mb={6}>
        {propertyDetails.map(({ heading, detail }: any) => (
          <Box className={styles.propertyDetail} key={heading}>
            <Box fontWeight={700} flex={"0 0 35%"} py={1}>
              {heading}
            </Box>
            <Box flexGrow={1} py={1}>
              {detail}
            </Box>
          </Box>
        ))}
      </Box>
      <PropertyConstraints constraintsData={propertyConstraints} />
      <Box color="text.secondary" textAlign="right">
        <Button variant="text" color="inherit">
          Report an inaccuracy
        </Button>
      </Box>
    </Card>
  );
}

function PropertyConstraints({ constraintsData }: any) {
  const { title, constraints } = constraintsData;
  const visibleConstraints = constraints
    .filter((x: any, i: number) => i < 3)
    .map((con: any) => (
      <Constraint key={con.text} color={con.color || ""}>
        {ReactHtmlParser(con.text)}
      </Constraint>
    ));
  const hiddenConstraints = constraints
    .filter((x: any, i: number) => i >= 3)
    .map((con: any) => (
      <Constraint key={con.text} color={con.color || ""}>
        {ReactHtmlParser(con.text)}
      </Constraint>
    ));

  return (
    <Box mb={3}>
      <Box pb={2}>
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      </Box>
      {visibleConstraints}
      <SimpleExpand buttonText={{ open: "Show all", closed: "Show less" }}>
        {hiddenConstraints}
      </SimpleExpand>
    </Box>
  );
}

function Constraint({ children, color, ...props }: any) {
  const classes = useClasses();
  const theme = useTheme();
  return (
    <Box
      className={classes.constraint}
      bgcolor={color ? color : "background.paper"}
      color={
        color
          ? theme.palette.getContrastText(color)
          : theme.palette.text.primary
      }
      {...props}
    >
      {children}
    </Box>
  );
}

function SimpleExpand({ children, buttonText }: any) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  return (
    <>
      <Collapse in={isOpen}>
        <div>{children}</div>
      </Collapse>
      <Box color="text.secondary">
        <Button
          size="large"
          fullWidth
          color="inherit"
          onClick={() => setIsOpen((x) => !x)}
        >
          {isOpen ? buttonText.closed : buttonText.open}
        </Button>
      </Box>
    </>
  );
}
