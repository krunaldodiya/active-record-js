import { ModelCreated, ModelCreating, ModelSaved, ModelSaving, ModelUpdating, ModelUpdated } from '../emitter/events';
import { Builder } from '../query';
import { HasAttributes, HasRelationships, HasTimestamps, HidesAttributes } from './related';
import relations from './stores/relations';
import { applyMixins } from '../utils/mixins';


interface ProxyType {
    [name: string]: any;
}

class Model implements HasAttributes, HasRelationships, HasTimestamps, HidesAttributes, ProxyType
{
    // Allow any property since relations are added on initialization
    [property: string]: any;

    // Mixin type definitions

    CREATED_AT: string = 'createdAt';
    UPDATED_AT: string = 'updatedAt';

    attributes: object = {};
    appends: Array<string> = [];
    casts: object = {};
    changedAttributes: Array<string> = [];
    hidden: Array<string> = [];
    timestamps: boolean = true;

    belongsTo: (related: string, foreignKey: string, localKey?: string) => any;
    belongsToMany: (related: string, pivot: string, foreignPivotKey?: string, localPivotKey?: string) => any;
    clearChangedAttributes: () => void;
    fillAttributes: (attributes: object) => void;
    getAccessorProperty: (key: string|number) => any;
    getAttribute: (key: string|number) => any;
    getAttributes: () => any;
    getDirtyAttributes: () => object;
    getHidden: () => Array<string>;
    hasMany: (related: string, foreignKey: string, localKey?: string) => any;
    hasOne: (related: string, foreignKey: string, localKey?: string) => any;
    isAccessorProperty: (key: number|string) => boolean;
    isAttribute: (key: number|string) => boolean;
    isDirty: () => boolean;
    setAttribute: (key: string, value: any) => void;
    setCreatedAt: (timestamp: string) => any;
    setHidden: (keys: Array<string>) => void;
    setUpdatedAt: (timestamp: string) => any;

    // End mixin type definitions

    public static table: string = '';

    protected exists: boolean = false;
    protected incrementing: boolean = true;
    protected primaryKey: string = 'id';

    constructor(attributes: object = {}, exists = false)
    {
        this.fillAttributes(attributes);
        this.applyRelations();
        this.exists = exists;

        return new Proxy(this, {
            get: (object, property: number|string) => {
                if (object.isAttribute(property)) {
                    return object.getAttribute(property);
                }

                return object[property];
            },
            set: (object, property: string, value) => {
                object.setAttribute(property, value);
                return true;
            }
        });
    }

    private applyRelations()
    {
        relations.getRelations(this.constructor.name).forEach(relation =>
            Object.defineProperty(this, `\$${relation}`, {
                get: async () => await this[relation]().get()
            })
        );
    }

    public async delete()
    {
        if (this.exists) {
            return this.newModelQuery().where(this.primaryKey, '=', this.attributes[this.primaryKey]);
        }

        return false;
    }

    public static async findById(id: number): Promise<Model>
    {
        return new this().newModelQuery().setIsFirst(true).where('id', '=', id).get();
    }

    private newModelQuery(): Builder
    {
        return new Builder().setModel(this.constructor.name);
    }

    private async performInsert(query: Builder): Promise<boolean>
    {
        const id = await query.insert(this.attributes);
        this.id = id;
        this.exists = true;

        new ModelCreated(this).fire();
        return true;
    }

    private async performUpdate(query: Builder): Promise<boolean>
    {
        const success = await query.update(this.getDirtyAttributes());
        new ModelUpdated(this).fire();

        return success;
    }

    public async save(): Promise<boolean>
    {
        new ModelSaving(this).fire();

        let success = false;
        const query = this.newModelQuery();

        if (this.exists && this.isDirty())
        {
            new ModelUpdating(this).fire();
            success = await this.performUpdate(query);

        }
        else if (this.isDirty()) {
            new ModelCreating(this).fire();
            success = await this.performInsert(query);
        }

        if (success) {
            this.clearChangedAttributes();
            new ModelSaved(this).fire();
        }

        return success;
    }

    public static select(select: Array<string>): Builder
    {
        return new this().newModelQuery().select(select);
    }
}

applyMixins(Model, [HasAttributes, HasRelationships, HasTimestamps, HidesAttributes]);

export default Model;
