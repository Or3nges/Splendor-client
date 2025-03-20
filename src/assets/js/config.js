const GROUPNUMBER = "XX";
const GROUPTOKEN = "TOKEN";

const ERRORHANDLERSELECTOR = ".errormessages p";

const LOCALSERVER = `http://localhost:8001`;
const DEPLOYEDSERVER = `https://project-1.ti.howest.be/2024-2025/splendor/api/`;
const GROUPDEPLOYEDSERVER = `https://project-1.ti.howest.be/2024-2025/group-${GROUPNUMBER}/api`;

function getAPIUrl() {
  return DEPLOYEDSERVER;
}

export { getAPIUrl, GROUPTOKEN, ERRORHANDLERSELECTOR };
