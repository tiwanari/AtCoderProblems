import React from "react";
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledButtonDropdown,
  UncontrolledDropdown,
  Button
} from "reactstrap";

import { isAccepted } from "../../utils";
import { formatMoment, parseSecond } from "../../utils/DateUtil";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import Submission from "../../interfaces/Submission";
import SmallTable from "./SmallTable";
import DifficultyTable from "./DifficultyTable";
import ButtonGroup from "reactstrap/lib/ButtonGroup";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import State, {
  noneStatus,
  ProblemId,
  ProblemStatus
} from "../../interfaces/State";
import { List, Map, Range, Set } from "immutable";
import { requestMergedProblems } from "../../actions";
import ProblemModel from "../../interfaces/ProblemModel";
import { DifficultyCircle } from "../../components/DifficultyCircle";
import { ListTable } from "./ListTable";

export const INF_POINT = 1e18;

export interface ProblemRowData {
  readonly id: string;
  readonly title: string;
  readonly contest?: Contest;
  readonly contestDate: string;
  readonly contestTitle: string;
  readonly lastAcceptedDate: string;
  readonly solverCount: number;
  readonly point: number;
  readonly difficulty: number;
  readonly firstUserId: string;
  readonly executionTime: number;
  readonly codeLength: number;
  readonly mergedProblem: MergedProblem;
  readonly shortestUserId: string;
  readonly fastestUserId: string;
  readonly status: ProblemStatus;
}

interface ListPageState {
  fromPoint: number;
  toPoint: number;
  statusFilterState: "All" | "Only Trying" | "Only AC";
  ratedFilterState: "All" | "Only Rated" | "Only Unrated";
  fromDifficulty: number;
  toDifficulty: number;
}

class ListPage extends React.Component<Props, ListPageState> {
  constructor(props: any) {
    super(props);
    this.state = {
      fromPoint: 0,
      toPoint: INF_POINT,
      statusFilterState: "All",
      ratedFilterState: "All",
      fromDifficulty: -1,
      toDifficulty: INF_POINT
    };
  }

  componentDidMount(): void {
    this.props.requestData();
  }

  render() {
    const {
      mergedProblems,
      problemModels,
      submissions,
      userId,
      rivals,
      contests,
      statusLabelMap
    } = this.props;
    const {
      fromPoint,
      toPoint,
      ratedFilterState,
      statusFilterState,
      fromDifficulty,
      toDifficulty
    } = this.state;
    const rowData = mergedProblems
      .valueSeq()
      .map(
        (p): ProblemRowData => {
          const contest = contests.get(p.contest_id);
          const contestDate = contest
            ? formatMoment(parseSecond(contest.start_epoch_second))
            : "";
          const contestTitle = contest ? contest.title : "";

          const lastSubmission = submissions
            .get(p.id, List<Submission>())
            .filter(s => s.user_id === userId)
            .filter(s => isAccepted(s.result))
            .maxBy(s => s.epoch_second);
          const lastAcceptedDate = lastSubmission
            ? formatMoment(parseSecond(lastSubmission.epoch_second))
            : "";
          const point = p.point ? p.point : p.predict ? p.predict : INF_POINT;
          const firstUserId = p.first_user_id ? p.first_user_id : "";
          const executionTime =
            p.execution_time != null ? p.execution_time : INF_POINT;
          const codeLength = p.source_code_length
            ? p.source_code_length
            : INF_POINT;
          const shortestUserId = p.shortest_user_id ? p.shortest_user_id : "";
          const fastestUserId = p.fastest_user_id ? p.fastest_user_id : "";
          const difficulty = problemModels.getIn([p.id, "difficulty"], -1);

          return {
            id: p.id,
            title: p.title,
            contest,
            contestDate,
            contestTitle,
            lastAcceptedDate,
            solverCount: p.solver_count ? p.solver_count : 0,
            point,
            difficulty,
            firstUserId,
            executionTime,
            codeLength,
            mergedProblem: p,
            shortestUserId,
            fastestUserId,
            status: statusLabelMap.get(p.id, noneStatus())
          };
        }
      )
      .sort((a, b) => {
        const dateOrder = b.contestDate.localeCompare(a.contestDate);
        return dateOrder === 0 ? a.title.localeCompare(b.title) : dateOrder;
      })
      .toList();
    const points = mergedProblems
      .valueSeq()
      .map(p => p.point)
      .reduce((set, point) => (point ? set.add(point) : set), Set<number>())
      .toList()
      .sort();
    const difficulties = Range(0, 4400, 400)
      .map(from => ({
        from,
        to: from === 4000 ? INF_POINT : from + 399
      }))
      .toList();

    return (
      <div>
        <Row className="my-2 border-bottom">
          <h1>Point Status</h1>
        </Row>
        <Row>
          <SmallTable
            mergedProblems={mergedProblems}
            submissions={submissions}
            userIds={rivals.insert(0, userId)}
            setFilterFunc={(point: number) =>
              this.setState({ fromPoint: point, toPoint: point })
            }
          />
        </Row>

        <Row className="my-2 border-bottom">
          <h1>Difficulty Status</h1>
        </Row>
        <Row>
          <DifficultyTable
            mergedProblems={mergedProblems}
            submissions={submissions}
            userIds={rivals.insert(0, userId)}
            problemModels={problemModels}
            setFilterFunc={(from: number, to: number) =>
              this.setState({ fromDifficulty: from, toDifficulty: to })
            }
          />
        </Row>

        <Row className="my-2 border-bottom">
          <h1>Problem List</h1>
        </Row>
        <Row>
          <ButtonGroup className="mr-4">
            <UncontrolledButtonDropdown>
              <DropdownToggle caret>
                {this.state.fromPoint == 0
                  ? "Point From"
                  : this.state.fromPoint}
              </DropdownToggle>
              <DropdownMenu>
                {points.map(p => (
                  <DropdownItem
                    key={p}
                    onClick={() => this.setState({ fromPoint: p })}
                  >
                    {p}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
            <UncontrolledButtonDropdown>
              <DropdownToggle caret>
                {this.state.toPoint == INF_POINT
                  ? "Point To"
                  : this.state.toPoint}
              </DropdownToggle>
              <DropdownMenu>
                {points.map(p => (
                  <DropdownItem
                    key={p}
                    onClick={() => this.setState({ toPoint: p })}
                  >
                    {p}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
          </ButtonGroup>
          <ButtonGroup className="mr-4">
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {this.state.statusFilterState}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={() => this.setState({ statusFilterState: "All" })}
                >
                  All
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({
                      statusFilterState: "Only Trying"
                    })
                  }
                >
                  Only Trying
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({
                      statusFilterState: "Only AC"
                    })
                  }
                >
                  Only AC
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </ButtonGroup>
          <ButtonGroup className="mr-4">
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {this.state.ratedFilterState}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={() => this.setState({ ratedFilterState: "All" })}
                >
                  All
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({ ratedFilterState: "Only Rated" })
                  }
                >
                  Only Rated
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({
                      ratedFilterState: "Only Unrated"
                    })
                  }
                >
                  Only Unrated
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </ButtonGroup>

          <ButtonGroup className="mr-4">
            <UncontrolledButtonDropdown>
              <DropdownToggle caret>
                {fromDifficulty === -1
                  ? "Difficulty From"
                  : `${fromDifficulty} - `}
              </DropdownToggle>
              <DropdownMenu>
                {difficulties.map(({ from, to }) => (
                  <DropdownItem
                    key={from}
                    onClick={() => this.setState({ fromDifficulty: from })}
                  >
                    <DifficultyCircle
                      difficulty={to}
                      id={`from-difficulty-dropdown-${to}`}
                    />
                    {from} -
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
            <UncontrolledButtonDropdown>
              <DropdownToggle caret>
                {toDifficulty === INF_POINT
                  ? "Difficulty To"
                  : ` - ${toDifficulty}`}
              </DropdownToggle>
              <DropdownMenu>
                {difficulties.map(({ to }) => (
                  <DropdownItem
                    key={to}
                    onClick={() =>
                      this.setState({
                        fromDifficulty:
                          fromDifficulty !== -1 ? fromDifficulty : 0,
                        toDifficulty: to
                      })
                    }
                  >
                    <DifficultyCircle
                      difficulty={to}
                      id={`from-difficulty-dropdown-${to}`}
                    />
                    - {to < INF_POINT ? to : "inf"}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
          </ButtonGroup>

          <Button
            outline
            color="danger"
            onClick={() =>
              this.setState({
                fromPoint: 0,
                toPoint: INF_POINT,
                statusFilterState: "All",
                ratedFilterState: "All",
                fromDifficulty: -1,
                toDifficulty: INF_POINT
              })
            }
          >
            Reset
          </Button>
        </Row>
        <Row>
          <ListTable
            fromPoint={fromPoint}
            toPoint={toPoint}
            statusFilterState={statusFilterState}
            ratedFilterState={ratedFilterState}
            fromDifficulty={fromDifficulty}
            toDifficulty={toDifficulty}
            rowData={rowData}
          />
        </Row>
      </div>
    );
  }
}

interface Props {
  readonly userId: string;
  readonly rivals: List<string>;
  readonly submissions: Map<string, List<Submission>>;
  readonly mergedProblems: Map<string, MergedProblem>;
  readonly problemModels: Map<string, ProblemModel>;
  readonly contests: Map<string, Contest>;
  readonly statusLabelMap: Map<ProblemId, ProblemStatus>;

  readonly requestData: () => void;
}

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  submissions: state.submissions,
  mergedProblems: state.mergedProblems,
  contests: state.contests,
  statusLabelMap: state.cache.statusLabelMap,
  problemModels: state.problemModels
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => {
    dispatch(requestMergedProblems());
  }
});

export default connect(
  stateToProps,
  dispatchToProps
)(ListPage);
