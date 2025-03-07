import { ImageStageObject } from "../stageobjects";
import { Conversation } from "./Conversation";

export class Speaker {

  public get id() { return this.speaker.id; }

  public get x() { return this.speaker.x; }
  public set x(x) { this.speaker.x = x; }

  public get y() { return this.speaker.y; }
  public set y(y) { this.speaker.y = y; }

  public get width() { return this.speaker.width; }
  public set width(width) { this.speaker.width = width; }

  public get height() { return this.speaker.height; }
  public set height(height) { this.speaker.height = height; }

  public get path() { return this.speaker.path; }
  public set path(path) { this.speaker.path = path; }

  public get name() { return this.speaker.name; }
  public set name(name) { this.speaker.name = name; }

  constructor(public readonly speaker: ImageStageObject, public readonly conversation: Conversation) { }
}