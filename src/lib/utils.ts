export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function fuzzyScore(q: string, target: string): number {
  const ql = q.toLowerCase(),
    tl = target.toLowerCase();
  if (tl.includes(ql)) return 1000 - tl.indexOf(ql);
  let qi = 0,
    score = 0,
    last = -1;
  for (let ti = 0; ti < tl.length && qi < ql.length; ti++) {
    if (tl[ti] === ql[qi]) {
      score +=
        last === ti - 1 ? 10 : /[\s\-_.]/.test(tl[ti - 1] ?? "") ? 8 : 1;
      last = ti;
      qi++;
    }
  }
  return qi === ql.length ? score : -1;
}
