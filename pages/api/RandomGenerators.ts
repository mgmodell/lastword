// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from "axios";

const NAME_URL =
  "https://genr8rs.com/api/Content/Fun/MafiaNameGenerator?genr8rsUserId=1681049742.31146432c88e4c06e&_sT=1";
const TAUNT_URL =
  "https://genr8rs.com/api/Content/Fun/GameTauntGenerator?genr8rsUserId=1681049742.31146432c88e4c06e&_sInsultLevel=polite";

interface RandomContentCallback {
  (name: string): void;
}

export function RandomName(callback: RandomContentCallback) {
  axios.get(NAME_URL).then(resp => {
    const receivedName = resp.data._sResult;
    callback(receivedName);
  });
}
export function RandomTaunt(callback: RandomContentCallback) {
  axios.get(TAUNT_URL).then(resp => {
    const receivedTant = resp.data._sResult;
    callback(receivedTant);
  });
}
