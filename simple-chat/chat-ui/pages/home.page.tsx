import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Formik, FormikHelpers } from 'formik';
import { v4 as uuidv4, validate } from 'uuid';

import { getChatStreams, getChats } from '../api/chatApi.js';
import { Bubble, ChatBar, Container } from '../components/index.js';
import { ChatMessage } from '../types.js';

type FormValues = {
  message: string;
  sender: string;
};

const Home = (props) => {
  console.log('Home props:', props);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('...');
  const bubbleRef = useRef<HTMLDivElement>();

  const [searchParams, setSearchParam] = useSearchParams();
  const chatSessionId = searchParams.get('chatSessionId');

  useEffect(() => {
    if (!validate(chatSessionId)) {
      setSearchParam({ chatSessionId: uuidv4() });
    }

    const fetchChats = async () => {
      const history = await getChats(chatSessionId);
      setChatHistory(history.messages);
    };

    fetchChats();

    return () => {
      console.log('Home unmounted.');
    };
  }, []);

  const onSend = async (
    values: FormValues,
    helpers?: FormikHelpers<FormValues>
  ) => {
    const cleanMessage = values.message.trim();

    if (!cleanMessage) return;

    const history = [
      ...chatHistory,
      { message: values.message, user: 'user' as any },
    ];
    const messages = await getChatStreams(chatSessionId, cleanMessage);

    setChatHistory(history);
    helpers.setSubmitting(true);

    let response = '';

    for await (const message of messages) {
      response += message;
      setReply(response);
    }

    if (!response) return;
    history.push({ message: response, user: 'system' });
    helpers.setSubmitting(false);
    setReply('...');
    setChatHistory(history);
  };

  return (
    <Formik
      initialValues={{
        message: '',
        sender: '',
      }}
      onSubmit={onSend}
    >
      {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
        <Container>
          <div className="flex h-full flex-1 flex-col gap-4 p-4 overflow-y-scroll">
            {chatHistory.map((history) => (
              <Bubble
                key={history.id}
                message={history.message}
                sender={history.user}
              />
            ))}
            {isSubmitting && (
              <Bubble
                key={chatSessionId}
                innerRef={bubbleRef}
                message={reply}
                sender="system"
              />
            )}
          </div>
          <div className="w-full">
            <ChatBar
              placeholder="Please enter a message"
              value={values.message}
              setFieldValue={setFieldValue}
              onSendMessage={handleSubmit}
              disabled={isSubmitting}
            />
          </div>
        </Container>
      )}
    </Formik>
  );
};

export default Home;