export interface MonitorPositionsQueryParams {
  endpoint: string;
}

export interface MonitorPositionsData {
  borrower: string;
  over_limit: "true" | "false"
  borrow: number;
  limit: number;
}

export async function monitorPositionsQuery({
  endpoint,
}: MonitorPositionsQueryParams): Promise<MonitorPositionsData[]> {
  const positions: MonitorPositionsData[] = await fetch(
    `${endpoint}/v4/monitor-positions`
  ).then((res) => res.json());
  return positions;
}
