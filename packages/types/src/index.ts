export type BrandedId<TBrand extends string> = string & { __brand: TBrand };

export type UserId = BrandedId<'UserId'>;

export interface ApiHealth {
  status: 'ok';
}

