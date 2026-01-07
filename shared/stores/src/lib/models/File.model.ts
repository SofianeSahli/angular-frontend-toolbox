import { BaseModel } from "./Base.model";

export interface FileModel extends BaseModel {
  file_path: string;
  file_type: string;
  linked_object_type: string;
  linked_object_id: string;
  file_extension: string;

}

export enum FileType {
  GIF = 'GIF',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  HTML = 'HTML',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
  PDF = 'PDF',
}