export class AddImageDialog extends Dialog {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `/modules/${__MODULE_ID__}/templates/dialogs/add-image.hbs`,
      title: "STAGEMANAGER.DIALOGS.ADDIMAGE.TITLE"
    })
  }



  constructor(data: DialogData, options?: Partial<DialogOptions>) {
    super(data, options);
  }
}