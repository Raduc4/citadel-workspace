import { MutationHook } from '@common/types/hooks';
import { useRegister_c2s } from '@common/c2s';
import { ServiceRegisterAccepted } from '@common/types/c2s';
import { UseRegister } from '@common/c2s/useRegister_c2s';
import store from 'framework/redux/store';
import { execute } from 'framework/redux/slices/streamHandler.slice';
export default useRegister_c2s as UseRegister<typeof handler>;

export type RegisterHookDescriptor = {
  invokerInput: {
    uuid: string;
    fullName: string;
    serverAddr: string;
    username: string;
    proposedPassword: string;
  };
  dataReturn: ServiceRegisterAccepted;
};

export const handler: MutationHook<RegisterHookDescriptor> = {
  invokerOptions: {
    type: 'register',
  },
  invoker: async (context) => {
    let { invoke, input, options } = context;

    const { data } = await invoke(options.type, input);

    return data;
  },
  useHook:
    ({ invoke }) =>
    () => {
      return async (input) => {
        const response = await invoke(input);
        store.dispatch(
          execute({
            req_id: response,
            data: null,
            context_type: 'Register',
          })
        );
        return response;
      };
    },
};
