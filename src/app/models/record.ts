/**
 * Record data model.
 *
 * @export
 * @class Record
 */
export class Record {
  _id: string;

  constructor(obj?: any) {
    this._id = (obj && obj._id) || null;
  }
}
