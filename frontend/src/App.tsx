import { useEffect, useReducer, useRef, useState } from 'react'
import logo from './logo.png'
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeftRotate, faArrowLeft, faArrowUp, faArrowDown, faArrowRight, faArrowRightRotate } from '@fortawesome/free-solid-svg-icons'
import { Canvas } from '@react-three/fiber'
import Chunk from './Chunk'

type Turtle = { id: number, name: string }
const EMPTY_TURTLE: Turtle = { id: 0, name: "" }

type Coordinate = { x: number, y: number, z: number};
type RenderInfo = { turtlePos: Coordinate, chunks: Chunk[] };
const EMPTY_RENDERINFO: RenderInfo = { turtlePos: {x: 0, y: 0, z: 0}, chunks: [] };

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

function Chunkr(props: any) {
  const ref = useRef()
  
  return (
      <mesh {...props} ref={ref} scale={1}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color='hotpink' />
      </mesh>
  )
}

function World(props: any) {
  return (
    <>
      <Chunkr position={[1, 0, 0]} />
      <Chunkr position={[-1, 0, 0]} />
    </>
  )
}

function Display(props: any) {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[0, 0, 0]} />
      <World blockList={props.blocks} />
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

function coordToChunk({x, y, z}: Coordinate): Coordinate {
  return { x: (x >> 4), y: (y >> 4), z: (z >> 4) };
}

function normalize(ref: Coordinate, pos: Coordinate): Coordinate {
  return { x: (pos.x - ref.x), y: (pos.y - ref.y), z: (pos.z - ref.z) }
}

function getArrayLocation(turtlePos: Coordinate, chunkPos: Coordinate): number | undefined {
  const {x, y, z} = normalize(coordToChunk(turtlePos), chunkPos);
  if (x < -1 || 1 < x || 
    y < -1 || 1 < y || 
    z < -1 || 1 < z) return;
  return (y + 1) * 9 + (z + 1) * 3 + (x + 1);
}

function reducer(state: any, action: { type: string; value: any }) {
  const { turtlePos, chunks, dir } = action.value;
  switch (action.type) {
    case "full": /* Server Msg: { type: "fullchunkinfo", value: { turtlePos: {}, chunks: [] } */
      const newChunks: Chunk[] = [];
      for (let chunk of chunks) {
        const arrLoc = getArrayLocation(turtlePos, chunk.pos);
        if (arrLoc) state.chunks[arrLoc] = new Chunk(chunk);
      }
      return { turtlePos: action.value.turtlePos, chunks: newChunks };  

    case "pos": /* Server Msg: { type: "pos", value: { turtlePos: {}, dir: ... } */
      switch (dir) {
        case "UP":
          break
        case "DOWN":
          break
        case "LEFT":
          break
        case "RIGHT":
          break
        case "FORWARD":
          break
        case "BACKWARD":
          break
      }

    case "chunk":
      return 

  }
}

function App() {
  const [socket, setSocket] = useState(null as unknown as WebSocket);
  const [turtles, setTurtles] = useState<Turtle[]>([]);
  const [curr, setCurr] = useState(EMPTY_TURTLE);
  const [renderinfo, dispatch] = useReducer(reducer, EMPTY_RENDERINFO);

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

          case "fullchunkinfo":
            dispatch({ type: "full", value: msg.value });
            break

          case "pos":
            dispatch({ type: "pos", value: msg.value });
            break

          case "chunk":
            dispatch({ type: "chunk", value: msg.value });
            break

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
        <Display renderinfo={renderinfo} />
        <ControlPanel />
      </main>
    </div>
  )
}

export default App
