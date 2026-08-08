<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:frmwrk="Corel Framework Data">
  <xsl:output method="xml" encoding="UTF-8" indent="yes"/>

  <frmwrk:uiconfig>
    <frmwrk:applicationInfo userConfiguration="true" />
  </frmwrk:uiconfig>

  <xsl:template match="node()|@*">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="uiConfig/items">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
      <itemData guid="92c18352-1111-4cb0-a9cf-dc4099ea6402" type="browser" href="[VGAppAddonsDir]/2 Pro/index.html" enable="true"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="uiConfig/dockers">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
      <dockerData guid="92c18352-2222-4cb9-994c-28b7e289ea60" userCaption="FN Pro" bowl="right" showHeader="true" showCaption="true">
        <container>
          <item dock="fill" guidRef="92c18352-1111-4cb0-a9cf-dc4099ea6402"/>
        </container>
      </dockerData>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
