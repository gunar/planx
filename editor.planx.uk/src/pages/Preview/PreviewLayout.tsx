import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";
import { createMuiTheme, Theme, ThemeProvider } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ErrorFallback from "components/ErrorFallback";
import { clearLocalFlow } from "lib/local";
import { useStore } from "pages/FlowEditor/lib/store";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useCurrentRoute } from "react-navi";
import Logo from "ui/images/OGLLogo.svg";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { FlowSettings, FOOTER_ITEMS, Team, TextContent } from "../../types";

const PreviewLayout: React.FC<{
  team: Team;
  children?: any;
  settings?: FlowSettings;
  footerContent?: { [key: string]: TextContent };
}> = ({
  // theme = {
  //   primary: "#2c2c2c",
  // },
  team,
  children,
  settings,
  footerContent,
}) => {
  const { data } = useCurrentRoute();

  const makeHref = (path: string) => [data.mountpath, "pages", path].join("/");

  const [id] = useStore((state) => [state.id]);

  const handleRestart = () => {
    if (
      confirm(
        "Are you sure you want to restart? This will delete your previous answers"
      )
    ) {
      clearLocalFlow(id);
      window.location.reload();
    }
  };

  const flowSettingsContent = FOOTER_ITEMS.map((key) => {
    const setting = settings?.elements && settings?.elements[key];

    if (setting?.show) {
      return {
        title: setting.heading,
        href: makeHref(key),
        bold: key === "help",
      };
    }
  });

  const globalFooterItems = footerContent
    ? Object.entries(footerContent).map(([slug, item]) => ({
        title: item.heading,
        content: item.content,
        href: makeHref(slug),
      }))
    : [];

  const footerItems = [
    ...flowSettingsContent,
    ...globalFooterItems,
  ].filter((item): item is { title: string; href: string; bold: boolean } =>
    Boolean(item)
  );

  const primaryColour = team.theme?.primary || "#2c2c2c";

  const generatePreviewTheme = (baseTheme: Theme) =>
    createMuiTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        primary: {
          main: primaryColour,
        },
      },
    });

  return (
    <ThemeProvider theme={generatePreviewTheme}>
      <Header
        bgcolor={primaryColour}
        team={team}
        phaseBanner
        handleRestart={handleRestart}
      />
      <Box
        id="main-content"
        pt={5}
        display="flex"
        flex="1 0 auto"
        flexDirection="column"
        alignItems="center"
        bgcolor="white"
        position="relative"
      >
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {children}
        </ErrorBoundary>
      </Box>

      <Footer items={[...footerItems]}>
        <Box display="flex" alignItems="center">
          <Box pr={3} display="flex">
            <img src={Logo} alt="Open Government License Logo" />
          </Box>
          <Typography variant="body2">
            All content is available under the{" "}
            <Link
              href="http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              underline="always"
              color="inherit"
              target="_blank"
            >
              Open Government Licence v3
            </Link>
            , except where otherwise stated
          </Typography>
        </Box>
      </Footer>
    </ThemeProvider>
  );
};

export default PreviewLayout;
