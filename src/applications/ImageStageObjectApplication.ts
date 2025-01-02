import { StageObjectApplication } from "./StageObjectApplication";
import { ImageStageObject } from "../stageobjects";
import { SerializedImageStageObject } from "../types";
import { Tab } from "./types";
import { StageManager } from "../StageManager";

export class ImageStageObjectApplication extends StageObjectApplication<ImageStageObject, SerializedImageStageObject> {
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    },
    image: {
      template: `modules/${__MODULE_ID__}/templates/editObject/image.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  protected getTabs(): Record<string, Tab> {
    return {
      image: {
        id: "image",
        icon: "fas fa-image",
        label: "STAGEMANAGER.TABS.IMAGE",
        active: false,
        cssClass: "",
        group: "primary"
      }
    }
  }

  protected toLeft(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.x']").val(bounds.left + (this.stageObject.width * this.stageObject.anchor.x))
    return this;
  }

  protected topTop(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.y']").val(bounds.top + (this.stageObject.height * this.stageObject.anchor.y))
    return this;
  }

  protected toRight(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.x']").val(bounds.right - (this.stageObject.width * this.stageObject.anchor.x));
    return this;
  }

  protected toBottom(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.y']").val(bounds.bottom - (this.stageObject.height * this.stageObject.anchor.y));
    return this;
  }

  protected prepareStageObject(): SerializedImageStageObject {
    const prep = super.prepareStageObject();
    const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    return {
      ...prep,
      bounds: {
        ...prep.bounds,
        width: this.originalObject.bounds.width * bounds.width,
        height: this.originalObject.bounds.height * bounds.height
      }
    }
  }

  protected parseFormData(data: Record<string, unknown>): SerializedImageStageObject {
    const parsed = super.parseFormData(data);

    return parsed;
  }
}