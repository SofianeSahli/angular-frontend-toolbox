import { BaseModel } from "@shared/stores";

export interface Categorie extends BaseModel{
    name : string 
    children: Array<Categorie>
    is_income : 1 | 0
}