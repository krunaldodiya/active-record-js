export default class HasAttributes
{
    public appends: Array<string> = [];
    public casts: object = {};

    public attributes: object = {};
    public changedAttributes: Array<string> = [];

    public clearChangedAttributes(): void
    {
        this.changedAttributes = [];
    }

    public fillAttributes(attributes: object): void
    {
        for (const key in attributes) {
            this.setAttribute(key, attributes[key]);
        }
    }

    public getAccessorProperty(key: number|string): any
    {
        return this[`${key}Attribute`](this.attributes);
    }

    public getAttribute(key: number|string): any
    {
        if (this.isAccessorProperty(key)) {
            return this.getAccessorProperty(key);
        }

        return this.attributes[key];
    }

    public getAttributes(): object
    {
        return this.attributes;
    }

    public getDirtyAttributes(): object
    {
        const attributes = {};

        this.changedAttributes.forEach((attribute) => {
            attributes[attribute] = this.attributes[attribute];
        });

        return attributes;
    }

    public isAccessorProperty(key: number|string): boolean
    {
        if (typeof key === 'symbol') {
            return false;
        }

        return typeof this[`${key}Attribute`] !== 'undefined';
    }

    public isAttribute(key: number|string): boolean
    {
        return this.attributes.hasOwnProperty(key) || this.isAccessorProperty(key);
    }

    public isDirty(): boolean
    {
        return this.changedAttributes.length > 0;
    }

    public setAttribute(key: string, value: any): void
    {
        if (this.attributes[key] !== value && this.changedAttributes.indexOf(key) === -1) {
            this.changedAttributes.push(key);
        }

        this.attributes[key] = value;
    }
}
