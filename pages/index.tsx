// lib
import type { NextPage } from 'next'
import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeApp } from "firebase/app"
import { getDatabase, ref, update, push, child, onValue, onDisconnect, Database, DatabaseReference } from "firebase/database";

// components
import Head from 'next/head'
// import Image from 'next/image'

// style
import styles from '../styles/Home.module.css'

interface messageListType {
  date: string
  username: string
  message: string
}

interface userListType {
  userId: string
  username: string
}

interface HomeProps {
  config: object
}

const Home: NextPage<HomeProps> = ({config}) => {
  const ROOM_NAME = "room1"
  const USERS = `${ROOM_NAME}_users`

  const db = useRef<Database>()
  const starCountRef = useRef<DatabaseReference>()
  const usersRef = useRef<DatabaseReference>()
  const myUserId = useRef<string>()

  const [status, setStatus] = useState<"standby" | "join">("standby")
  const [userName, setUserName] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [messageList, setMessageList] = useState<messageListType[]>([])
  const [userList, setUserList] = useState<userListType[]>([])

  useEffect(() => {
    const app = initializeApp(config)
    const database = getDatabase(app)
    db.current = database

    starCountRef.current = ref(database, ROOM_NAME)
    usersRef.current = ref(database, USERS)

    // メッセージデータの取得
    onValue(starCountRef.current, (snapshot) => {
      const data = snapshot.val()
      if(!data) return
      const dataList = Object.entries(data).map(data => data[1]) as messageListType[]
      setMessageList(dataList)
      console.log(snapshot)
    })

    // ユーザーデータの取得
    onValue(usersRef.current, (snapshot) => {
      const data = snapshot.val()
      if(!data) return
      const dataList = Object.entries(data).map(data => data[1]) as userListType[]
      setUserList(dataList)
    })

    // TODO: コンパイルエラーの修正
    // TODO: vercelに環境変数の設定
  }, [])

  const postMessage = useCallback((username: string, message: string) => {
    if(!db.current || !starCountRef.current) return

    const newPostKey = push(child(starCountRef.current, ROOM_NAME)).key

    const formatDate = (dateTime: Date)=>{
      let formatted_date = dateTime.getFullYear() + "-" + (dateTime.getMonth() + 1) + "-" + dateTime.getDate() + " " + dateTime.getHours() + ":" + dateTime.getMinutes() + ":" + dateTime.getSeconds();
      return formatted_date;
    }

    const updates = {}
    const postData = {
      date: formatDate(new Date()),
      username: username,
      message: message,
    }
    // @ts-ignore
    updates[`/${ROOM_NAME}/${newPostKey}`] = postData
    // @ts-ignore
    // updates['/user-posts/' + newPostKey] = postData;

    update(ref(db.current), updates)
  }, [])

  const joinUser = useCallback((myUserId: string, username: string) => {
    if(!db.current || !usersRef.current) return

    const newPostKey = push(child(usersRef.current, USERS)).key

    const updates = {}
    const postData = {
      userId: myUserId,
      username: username,
    }
    // @ts-ignore
    updates[`/${USERS}/${newPostKey}`] = postData
    // @ts-ignore
    // updates['/user-posts/' + newPostKey] = postData;

    update(ref(db.current), updates)
  }, [])

  const onJoin = () => {
    // const userId = Math.random().toString(32).substring(2)
    // myUserId.current = userId
    // joinUser(userId, userName)
    setStatus("join")
  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.content}>
        <h1 className="title">ゆるチャ</h1>
        {/* <div>{userList.length}人参加中</div> */}
        <div className="box">
          {status === "join" ? (
            <>
              <div className={styles.box}>
                {messageList.map((data, index) => (
                  <div key={index} className={styles.message_box}>
                    <div className={styles.message_name}>{data.username}<span className={styles.message_date}>{data.date}</span></div>
                    <div>{data.message}</div>
                  </div>
                ))}
              </div>
              <div className={styles.chat_write_box}>
                <input
                  className="input is-rounded"
                  type="text"
                  placeholder="メッセージ"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                  }}
                />
                <button
                  className="button is-primary"
                  onClick={() => {
                    postMessage(userName, message)
                    setMessage("")
                  }}
                >
                  送信
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label className="label">おなまえ</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="名無し"
                    onChange={(e) => {
                      setUserName(e.target.value)
                    }}
                  />
                </div>
              </div>
              <button
                className="button is-primary"
                onClick={() => onJoin()}
              >
                参加
              </button>
            </>
          )}
        </div>
      </main>

      {/* <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer> */}
    </div>
  )
}

export async function getStaticProps() {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  }
  // const app = await initializeApp(firebaseConfig)
  // const database = getDatabase(app);
  return {
    props: {
      config: firebaseConfig,
    }
  }
}

export default Home
