import type { Model, Document , UpdateQuery , QueryFilter} from "mongoose";

// base class to handle common database operations for all repositories
export abstract class BaseRepository<T extends Document>{
    constructor(protected readonly model: Model<T>){}

    async create(item : Partial<T>){
        return await this.model.create(item)
    }

    async update(id:string,item:UpdateQuery<T>){
        return await this.model.findByIdAndUpdate(id ,item , {returnDocument:"after"}).exec()
    }

    async findOne(filter:QueryFilter<T>){
        return await this.model.findOne(filter).exec()
    }

    async findAll(filter?:QueryFilter<T>){
        return await this.model.find(filter).exec()
    }

    async findById(id:string){
        return await this.model.findById(id).exec()
    }
    
        async delete(id: string) {
            return await this.model.findByIdAndDelete(id).exec();
        }
}
