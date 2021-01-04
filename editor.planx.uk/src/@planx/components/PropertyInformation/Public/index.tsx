import "./map.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Card from "@planx/components/shared/Preview/Card";
import QuestionHeader from "@planx/components/shared/Preview/QuestionHeader";
import useAxios from "axios-hooks";
import capitalize from "lodash/capitalize";
import React, { useEffect } from "react";

import { useStore } from "../../../../pages/FlowEditor/lib/store";
import BasicMap from "./BasicMap";
import { convertOrdnanceSurveyToStandard } from "./maputils";
import PropertyConstraints from "./PropertyConstraints";
import PropertyDetail from "./PropertyDetail";
import { propertyInformationStyles } from "./styles";

const PropertyInformation = ({
  title,
  description,
  propertyDetails,
  propertyConstraints,
  lat,
  lng,
  handleSubmit: handleSubmit,
}: any) => {
  const classes = propertyInformationStyles();

  return (
    <Card handleSubmit={handleSubmit} isValid>
      <QuestionHeader title={title} description={description} />
      <Box className={classes.map}>
        <BasicMap zoom={18} lat={lat} lng={lng} setBoundary={console.log} />
        <Box color="text.secondary" textAlign="right">
          <Button variant="text" color="inherit">
            Redraw boundary
          </Button>
        </Box>
      </Box>
      <Box mb={6}>
        {propertyDetails.map(({ heading, detail }: any) => {
          return (
            <PropertyDetail key={heading} heading={heading} detail={detail} />
          );
        })}
      </Box>
      <PropertyConstraints constraintsData={propertyConstraints} />
      <Box color="text.secondary" textAlign="right">
        <Button variant="text" color="inherit">
          Report an inaccuracy
        </Button>
      </Box>
    </Card>
  );
};

const PropWithConstraints = ({ info, handleSubmit: handleSubmit }: any) => {
  const url = `https://local-authority-api.planx.uk/${info.team}?x=${info.x}&y=${info.y}&cacheBuster=10`;
  const [{ data }] = useAxios(url);
  const [id, flow, startSession] = useStore((state) => [
    state.id,
    state.flow,
    state.startSession,
  ]);

  // const flow = useContext(PreviewContext);
  useEffect(() => {
    if (flow && data && info) {
      startSession({ passport: { data, info } });
    }
  }, [flow, data, info, id]);

  if (!data) return null;

  const { lng, lat } = convertOrdnanceSurveyToStandard(info.x, info.y);

  return (
    <PropertyInformation
      handleSubmit={handleSubmit}
      title="About the property"
      lng={lng}
      lat={lat}
      description="This is the information we currently have about the property"
      propertyDetails={[
        {
          heading: "Address",
          detail: [
            info.organisation,
            info.sao,
            [info.pao, info.street].filter(Boolean).join(" "),
            info.town,
          ]
            .filter(Boolean)
            .join(", "),
        },
        {
          heading: "Postcode",
          detail: info.postcode,
        },
        {
          heading: "District",
          detail: capitalize(info.team),
        },
        {
          heading: "Building type",
          detail: info.planx_description,
        },
        // {
        //   heading: "UPRN",
        //   detail: info.UPRN,
        // },
      ]}
      propertyConstraints={{
        title: "Constraints",
        constraints: (Object.values(data) || []).filter(
          ({ text }: any) => text
        ),
      }}
    />
  );
};

const PropertyInformationWithData: React.FC<any> = ({
  UPRN = 10009795450,
  handleSubmit: handleSubmit = console.log,
}) => {
  const [{ data }] = useAxios(
    `https://llpg.planx.uk/addresses?limit=1&UPRN=eq.${UPRN}&nocache`
  );

  if (!data) return null;

  const info = data[0];

  return <PropWithConstraints info={info} handleSubmit={handleSubmit} />;
};

export default PropertyInformationWithData;
