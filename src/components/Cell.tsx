import { CellOptions } from "../types";

type Props = {
  type: CellOptions;
};

export default function Cell({ type }: Props) {
  return <div className={`cell ${type}`} />;
}
