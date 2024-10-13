import { ImageStageObject } from './ImageStageObject';

export class TokenStageObject extends ImageStageObject {
  #token: Token;

  constructor(token: Token | TokenDocument) {
    console.log("Adding:", token);
    const doc = (token instanceof TokenDocument) ? token : (token.document);
    super(doc.actor?.img ?? "");

    // super(texture);
    this.#token = ((token instanceof Token) ? token : token.object)!;
  }
}