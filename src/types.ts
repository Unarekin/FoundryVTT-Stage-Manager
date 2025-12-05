// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedStageObject {

}

export interface SocketMessage<t extends any[] = []> {
  id: string;
  message: string;
  timestamp: number;
  sender: string;
  users: string[];
  args: t
}