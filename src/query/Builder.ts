import { DB } from '../connection';
import { PaginateObject, Pagination } from '../libraries/Pagination';
import models from '../model/stores/models';
import { JoinType } from './constants';
import { Join, Order, Where } from './expressions';
import Compiler from './Compiler';


export default class Builder
{
    // The model class associated with this query. If there is a model class, it will be used to transform
    // returned row(s) into model instances
    public model: string = '';

    // Select distinct
    public isDistinct: boolean = false;

    // Limits the query to 1 and returns the first result if true
    public isFirst: boolean = false;

    public rawSelects: Array<string> = [];
    public selects: Array<string> = [];

    // The base table of the query. All other tables are appended via joins
    public fromTable: string = '';

    public groups: Array<any> = [];
    public havings: Array<any> = [];
    public joins: Array<any> = [];
    public limits: number;
    public offsets: number;
    public orders: Array<Order> = [];
    public updates: object = {};
    public wheres: Array<Where> = [];

    // SQL compiler converts a query builder object into a SQL string
    private compiler: Compiler;

    constructor()
    {
        this.compiler = new Compiler();
    }

    public async count(): Promise<any>
    {
        const sql = this.compiler.compileSelect(this, true);
        let rows = await DB.run(sql);

        return rows[0].count;
    }

    public async delete(attributes = {})
    {
        for (const key in attributes) {
            this.where(key, '=', attributes[key]);
        }

        const sql = this.compiler.compileDelete(this);
        await DB.run(sql);
    }

    public distinct(): Builder
    {
        this.isDistinct = true;
        return this;
    }

    public async first(): Promise<any>
    {
        this.setIsFirst(true);
        return await this.get();
    }

    public from(table: string): Builder
    {
        this.fromTable = table;

        if (this.selects.length === 0) {
            this.selects.push(`${table}.*`);
        }

        return this;
    }

    public async get(): Promise<any>
    {
        const sql = this.compiler.compileSelect(this);
        let rows = await DB.run(sql);
        rows = this.transformRows(rows);

        if (this.isFirst) {
            return rows.shift();
        }

        return rows;
    }

    public groupBy(groups: Array<string>): Builder
    {
        this.groups = groups;
        return this;
    }

    public async insert(attributes: object): Promise<number>
    {
        const sql = this.compiler.compileInsert(this, [attributes]);
        const { insertId } = await DB.run(sql);

        return insertId;
    }

    public async insertMany(rows: Array<object>): Promise<any>
    {
        const sql = this.compiler.compileInsert(this, rows);
        const result = await DB.run(sql);

        return result;
    }

    public join(table: string, localKey: string, operator: string, foreignKey: string): Builder
    {
        this.joins.push(new Join(table, localKey, operator, foreignKey, JoinType.Inner));
        return this;
    }

    public leftJoin(table: string, localKey: string, operator: string, foreignKey: string): Builder
    {
        this.joins.push(new Join(table, localKey, operator, foreignKey, JoinType.Left));
        return this;
    }

    public limit(limit: number): Builder
    {
        if (!Number.isInteger(limit)) {
            throw `Limit must be an integer: ${limit}`;
        }

        this.limits = limit;
        return this;
    }

    public setModel(model: string): Builder
    {
        this.model = model;
        this.from(models.getModel(model).table);

        return this;
    }

    public offset(offset: number): Builder
    {
        if (!Number.isInteger(offset)) {
            throw `Offset must be an integer: ${offset}`;
        }

        this.offsets = offset;
        return this;
    }

    public orderBy(column: string, direction?: string): Builder
    {
        this.orders.push(new Order(column, direction));
        return this;
    }

    public orWhere(column: string, operator: string, value: number|string): Builder
    {
        this.wheres.push(new Where(column, operator, value, Where.conditions.OR));
        return this;
    }

    public async paginate(options: any): Promise<PaginateObject>
    {
        const pagination = new Pagination({query: this, ...options});
        return await pagination.paginate();
    }

    public rightJoin(table: string, localKey: string, operator: string, foreignKey: string): Builder
    {
        this.joins.push(new Join(table, localKey, operator, foreignKey, JoinType.Right));
        return this;
    }

    public select(selects: Array<string>): Builder
    {
        this.selects = selects.slice();
        return this;
    }

    public setIsFirst(isFirst: boolean): Builder
    {
        this.isFirst = isFirst;

        if (isFirst) {
            this.limit(1);
        }

        return this;
    }

    public toSql(): string
    {
        return this.compiler.compileSelect(this);
    }

    private transformRows(rows: Array<any>): Array<any>
    {
        if (!this.model) {
            return rows;
        }

        const Model = models.getModel(this.model);
        return rows.map(row => new Model(row, true));
    }

    public async update(updates): Promise<any>
    {
        const sql = this.compiler.compileUpdate(this, updates);
        return await DB.run(sql);
    }

    public where(column: string, operator: string, value: number|string): Builder
    {
        this.wheres.push(new Where(column, operator, value, Where.conditions.AND));
        return this;
    }

    public whereIn(column: string, value: Array<number|string>): Builder
    {
        this.wheres.push(new Where(column, 'in', value, Where.conditions.AND));
        return this;
    }
}
