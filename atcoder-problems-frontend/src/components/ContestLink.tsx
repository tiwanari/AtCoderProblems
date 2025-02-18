import React from "react";
import * as Url from "../utils/Url";
import Contest from "../interfaces/Contest";


interface Props {
  contest: Contest;
  title?: string;
}

enum RatedTargetType {
  All,
  Unrated,
};

type RatedTarget = Number | RatedTargetType;

function getRatedTarget(contest: Contest) : RatedTarget {
  const agc001date = 1468670400;
  if(agc001date > contest.start_epoch_second) return RatedTargetType.Unrated;
  switch (contest.rate_change){
    case undefined:
      return RatedTargetType.Unrated;
    case "-":
      return RatedTargetType.Unrated;
    case "All":
      return RatedTargetType.All;
    case (/\d+/.test(contest.rate_change) ? contest.rate_change : false):
      const tmp = /\d+/.exec(contest.rate_change);
      if(tmp !== null) return parseInt(tmp[0]);
    default:
      return RatedTargetType.Unrated;
  }
}

function getColorClass(target: RatedTarget): string {
  if(target === RatedTargetType.All) return "difficulty-red";
  if(target === RatedTargetType.Unrated) return "";

  if (target < 400) return "difficulty-grey";
  else if (target < 800) return "difficulty-brown";
  else if (target < 1200) return "difficulty-green";
  else if (target < 1600) return "difficulty-cyan";
  else if (target < 2000) return "difficulty-blue";
  else if (target < 2400) return "difficulty-yellow";
  else if (target < 2800) return "difficulty-orange";
  else return "difficulty-red";
}

const ContestLink: React.FC<Props> = props => {
  const {
    contest,
    title
  } = props;
  const target: RatedTarget = getRatedTarget(contest);

  return (
    <>
      <span className={getColorClass(target)}>◉</span>
      <> </>
      <a target="_blank" href={Url.formatContestUrl(contest.id)}>
        {title !== undefined ? title : contest.title}
      </a>
    </>
  );
};

export default ContestLink;
