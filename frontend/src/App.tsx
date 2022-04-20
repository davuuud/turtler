import { useEffect, useState } from 'react'
import logo from './logo.png'
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeftRotate, faArrowLeft, faArrowUp, faArrowDown, faArrowRight, faArrowRightRotate } from '@fortawesome/free-solid-svg-icons'
import { Canvas } from '@react-three/fiber'
import World from  './World'

type Turtle = {id: number, name: string}
const EMPTY_TURTLE: Turtle = {id: 0, name: ""}

function ControlPanel() {
  return (
    <div className="ControlPanel">
      <button><FontAwesomeIcon icon={faArrowLeftRotate}></FontAwesomeIcon></button>
      <button><FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon></button>
      <div className="UpDown">
        <button><FontAwesomeIcon icon={faArrowUp}></FontAwesomeIcon></button>
        <button><FontAwesomeIcon icon={faArrowDown}></FontAwesomeIcon></button>
      </div>
      <button><FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon></button>
      <button><FontAwesomeIcon icon={faArrowRightRotate}></FontAwesomeIcon></button>
    </div>
  )
}

function Display(props: any) {

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[0, 0, 0]} />
      <World requestChunk={props.requestChunk} blockList={props.blocks} />
    </Canvas>
  )
}

function TurtleEntry(props: any) {
  return (props.isSelected) ? 
    <div className="TurtleEntry selected">{props.turtle.name}</div> :
    <div className="TurtleEntry" onClick={() => props.onSelect(props.turtle)}>{props.turtle.name}</div>
}

function TurtleSelector(props: any) {
  const [filter, setFilter] = useState("")

  const list = props.turtles.map(
    (t: Turtle) => {
      if (t.name.indexOf(filter) === -1 && t.id !== props.curr.id) return
      return <TurtleEntry
              key={t.id}
              turtle={t}
              isSelected={t === props.curr}
              onSelect={props.onSelect} />
    })

  return (
    <aside>
      <div className="Searchbar">
        <input type="text"
          placeholder="Filter"
          value={filter}
          onChange={(e: any) => setFilter(e.target.value)} />
      </div>
      <div className="TurtleList">
        {list}
      </div>
    </aside>
  )
}

function App() {
  const [socket, setSocket] = useState(null as unknown as WebSocket);
  const [turtles, setTurtles] = useState<Turtle[]>([]);
  const [curr, setCurr] = useState<Turtle>(EMPTY_TURTLE);
  const [chunks, setChunks] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080")

    socket.onopen = event => {
      console.log("Connection established")
      socket.send(JSON.stringify({type: "get", value: "turtles"}))
    }
    
    socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case "full":
            setTurtles(msg.turtles)
            setCurr(msg.turtles.find((t: Turtle) => t.id === curr.id) || EMPTY_TURTLE)
            break

          case "hi":
            setTurtles(prevState => 
              [...prevState.filter(t => t.id !== msg.turtle.id), msg.turtle].sort((a, b) => a.id - b.id)
            )
            break

          case "bye":
            setTurtles(prevState => prevState.filter(t => t.id !== msg.turtle.id))
            if (msg.turtle.id === curr.id) setCurr(EMPTY_TURTLE)
            break

          case "chunk":
            
        }
      } catch {}
    }

    setSocket(socket);

    return () => { socket.close(); setSocket(null as unknown as WebSocket); }
  }, []);

  const currSelect = (turtle: Turtle) => {
    setCurr(turtle);
    socket.send(JSON.stringify({type: "subscribe", value: turtle}));
  }

  return (
    <div className="App">
      <header>
        <div className="Logobox"><img className="App-logo" src={logo} alt="Logo" />Turtler</div>
        <nav>xd</nav>
      </header>
      <TurtleSelector
        turtles={turtles}
        curr={curr}
        onSelect={currSelect} />
      <main>
        <Display chunks={chunks} />
        <ControlPanel />
      </main>
    </div>
  )
}

export default App
