import { Layout } from '@components/common/Layout';
import React from 'react';
import Chat from '@components/chat';
import serverConnect from '@hooks/c2s/useC2SConnect';
import genUuid from '@lib/utils';
import store from '@redux/store';
import { addToContext } from '@redux/slices/streamHandler.slice';

export default function Home() {
  return (
    <>
      <div className="flex flex-col justify-between no-">
        <button
          className="text-red-500"
          onClick={async () => {
            const data: string = await serverConnect({
              fullName: 'test',
              username: genUuid(),
              proposedPassword: 'test',
              serverAddr: '127.0.0.1:12349',
            });
            store.dispatch(
              addToContext({
                req_id: data,
                context_type: 'RegisterAndConnect',
              })
            );
            console.log(data);
          }}
        >
          Register
        </button>

        <main className="pt-10 h-[calc(100vh-7rem)] w-full flex flex-col justify-between no-scrollbar">
          <Chat />
        </main>
      </div>
    </>
  );
}

Home.Layout = Layout;
