import { MutationHook } from '@common/types/hooks';

export interface ApiHooks {
  c2s: {
    useRegister: MutationHook;
    useConnect: MutationHook;
    useDisconnect: MutationHook;
  };
  useMessage: MutationHook;
}
