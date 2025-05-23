const GROUPNUMBER = "10";
const GROUPTOKEN = "Group10-4651-990";
const ERRORHANDLERSELECTOR = ".errormessages p";

const LOCALSERVER = `http://localhost:8080`;
const DEPLOYEDSERVER = `https://project-1.ti.howest.be/2024-2025/splendor/api`;
const GROUPDEPLOYEDSERVER = `https://project-1.ti.howest.be/2024-2025/group-${GROUPNUMBER}/api`;

function getAPIUrl() {
  return LOCALSERVER;
}

export { getAPIUrl, GROUPTOKEN, ERRORHANDLERSELECTOR };
