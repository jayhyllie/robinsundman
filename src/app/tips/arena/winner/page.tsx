import { redirect } from "next/navigation";

/** Catch mistaken /tips/arena/winner → live winner screen */
export default function TipsArenaWinnerAliasPage() {
  redirect("/tips/arena/live/winner");
}
