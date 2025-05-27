export type Callback<T> = (data: T) => void;

export interface Subscriber<T> {
  uniqueId: string;
  callback: Callback<T>;
}

export interface ViewModelState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
