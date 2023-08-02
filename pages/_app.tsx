import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
import '../tailwind.css';
import { FC, ReactNode, useEffect, useState } from 'react';
import { UIProvider, useUI } from '@components/ui/context';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

import { Provider } from 'react-redux';
import store from 'framework/redux/store';
import { setUuid } from 'framework/redux/slices/uuid.slice';
import { ServiceRegisterAccepted } from '@common/types/c2s';

const Noop: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;

function CustomApp({
  Component,
  pageProps,
}: AppProps & { Component: { Layout: FC<{ children: ReactNode }> } }) {
  const [connErr, setErr] = useState('');
  useEffect(() => {
    const gen = async () => {
      try {
        const uuid_value: string = await invoke('open_tcp_conn', {
          addr: '127.0.0.1:3000',
        });
        console.log('UUID', uuid_value);
        store.dispatch(setUuid(uuid_value));
      } catch (error) {
        console.log(error);
        setErr(error as string);
      }
    };
    gen();
    const unlisten_register = listen<ServiceRegisterAccepted>(
      'register',
      (event) => {
        console.log(event);
      }
    );
    return () => {
      unlisten_register.then((unlisten) => unlisten());
    };
  }, []);

  const Layout = Component.Layout ?? Noop;
  return (
    <div className="select-none">
      <Head>
        <title>Citadel</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Script
          id="flowbite"
          src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.6/flowbite.min.js"
        />
        <main className="flex-grow bg-gray-100 shadow-inner">
          <Provider store={store}>
            <UIProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </UIProvider>
          </Provider>
        </main>
      </div>
    </div>
  );
}

export default CustomApp;
