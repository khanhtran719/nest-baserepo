export const REPOSITORY_PROVIDER = Symbol('REPOSITORY_PROVIDER');

export interface RepositoryLike<T> {
  save(entity: T): Promise<T>;
}

export interface RepositoryProvider {
  get<T>(entity: new () => T): RepositoryLike<T>;
}
