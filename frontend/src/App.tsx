import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import logo from "./logo.png";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftRotate,
  faArrowLeft,
  faArrowUp,
  faArrowDown,
  faArrowRight,
  faArrowRightRotate,
} from "@fortawesome/free-solid-svg-icons";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Chunk from "./Chunk";

type Turtle = { id: number; name: string };
type Coordinate = [x: number, y: number, z: number];
type RenderInfo = { turtlePos: Coordinate; chunks: Chunk[] };
const EMPTY_RENDERINFO: RenderInfo = { turtlePos: [0, 0, 0], chunks: [] };

function addScalar(coord: Coordinate, scalar: number): Coordinate {
  const [x, y, z] = coord;
  return [x + scalar, y + scalar, z + scalar];
}

function mulScalar(coord: Coordinate, scalar: number): Coordinate {
  const [x, y, z] = coord;
  return [x * scalar, y * scalar, z * scalar];
}

function ControlPanel() {
  return (
    <div className="ControlPanel">
      <button>
        <FontAwesomeIcon icon={faArrowLeftRotate}></FontAwesomeIcon>
      </button>
      <button>
        <FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon>
      </button>
      <div className="UpDown">
        <button>
          <FontAwesomeIcon icon={faArrowUp}></FontAwesomeIcon>
        </button>
        <button>
          <FontAwesomeIcon icon={faArrowDown}></FontAwesomeIcon>
        </button>
      </div>
      <button>
        <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
      </button>
      <button>
        <FontAwesomeIcon icon={faArrowRightRotate}></FontAwesomeIcon>
      </button>
    </div>
  );
}

function Subchunk(props: { chunk: Chunk; position: number[] }) {
  const { positions, normals, indices } = props.chunk.calcChunkGeometryData();
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshLambertMaterial({ color: "green" });

  const positionNumComponents = 3;
  const normalNumComponents = 3;
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(positions),
      positionNumComponents
    )
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
  );
  geometry.setIndex(indices);

  return (
    <mesh
      {...props.position}
      scale={1}
      geometry={geometry}
      material={material}
    />
  );
}

function World({
  turtleChunkPos,
  chunks,
}: {
  turtleChunkPos: Coordinate;
  chunks: Chunk[];
}) {
  const chunkList = chunks.map((c: Chunk, index: number) => {
    const position = normalize(turtleChunkPos, c.pos);
    const pos = mulScalar(position, 16);
    return <Subchunk key={index} chunk={c} position={pos} />;
  });

  return <>{chunkList}</>;
}

function Turtle({ position }: { position: Coordinate }) {
  return (
    <mesh visible position={position} scale={1}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  );
}

function Display({ renderinfo }: { renderinfo: RenderInfo }) {
  const { turtlePos, chunks } = renderinfo;
  const pos = addScalar(turtlePos, 0.5);
  const turtleChunkPos = coordToChunk(turtlePos);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[0, 0, 0]} />
      <OrbitControls />
      <Turtle position={pos} />
      <World turtleChunkPos={turtleChunkPos} chunks={chunks} />
    </Canvas>
  );
}

function TurtleEntry(props: any) {
  return props.isSelected ? (
    <div className="TurtleEntry selected">{props.turtle.name}</div>
  ) : (
    <div className="TurtleEntry" onClick={() => props.onSelect(props.turtle)}>
      {props.turtle.name}
    </div>
  );
}

function TurtleSelector(props: any) {
  const [filter, setFilter] = useState("");

  const list = props.turtles.map((t: Turtle) => {
    if (t.name.indexOf(filter) === -1 && t.id !== props.curr.id) return;
    return (
      <TurtleEntry
        key={t.id}
        turtle={t}
        isSelected={t === props.curr}
        onSelect={props.onSelect}
      />
    );
  });

  return (
    <aside>
      <div className="Searchbar">
        <input
          type="text"
          placeholder="Filter"
          value={filter}
          onChange={(e: any) => setFilter(e.target.value)}
        />
      </div>
      <div className="TurtleList">{list}</div>
    </aside>
  );
}

function coordToChunk([x, y, z]: Coordinate): Coordinate {
  return [x >> 4, y >> 4, z >> 4];
}

function normalize(ref: Coordinate, pos: Coordinate): Coordinate {
  const [refx, refy, refz] = ref;
  const [posx, posy, posz] = ref;
  return [posx - refx, posy - refy, posz - refz];
}

function getArrayLocation(
  turtlePos: Coordinate,
  chunkPos: Coordinate
): number | undefined {
  const [x, y, z] = normalize(coordToChunk(turtlePos), chunkPos);
  if (x < -1 || 1 < x || y < -1 || 1 < y || z < -1 || 1 < z) return;
  return (y + 1) * 9 + (z + 1) * 3 + (x + 1);
}

function reducer(state: any, action: { type: string; value: any }) {
  const { turtlePos, chunks, dir, pos, data } = action.value;
  const newChunks: Chunk[] = [];
  switch (action.type) {
    case "full" /* Server Msg: { type: "fullchunkinfo", value: { turtlePos: [], chunks: [] } */:
      for (let chunk of chunks) {
        const arrLoc = getArrayLocation(turtlePos, chunk.pos);
        if (arrLoc) newChunks[arrLoc] = new Chunk(chunk);
      }
      return { turtlePos: turtlePos, chunks: newChunks };

    case "pos" /* Server Msg: { type: "pos", value: { turtlePos: [], dir: ... } */:
      if (coordToChunk(state.turtlePos) === coordToChunk(turtlePos))
        return { turtlePos: turtlePos, chunks: state.chunks };
      switch (dir) {
        case "UP":
          for (let i = 0; i < 18; ++i) {
            newChunks[i] = chunks[i + 9];
          }
          break;
        case "DOWN":
          for (let i = 26; i > 8; --i) {
            newChunks[i] = chunks[i - 9];
          }
          break;
        case "LEFT":
          for (let i = 1; i < 27; i += 3) {
            for (let j = 0; j < 2; ++j) {
              const c = i + j;
              newChunks[c] = chunks[c - 1];
            }
          }
          break;
        case "RIGHT":
          for (let i = 0; i < 27; i += 3) {
            for (let j = 0; j < 2; ++j) {
              const c = i + j;
              newChunks[c] = chunks[c + 1];
            }
          }
          break;
        case "FORWARD":
          for (let i = 3; i < 27; i += 9) {
            for (let j = 0; j < 6; ++j) {
              const c = i + j;
              newChunks[c] = chunks[c - 3];
            }
          }
          break;
        case "BACKWARD":
          for (let i = 0; i < 27; i += 9) {
            for (let j = 0; j < 6; ++j) {
              const c = i + j;
              newChunks[c] = chunks[c + 3];
            }
          }
          break;
      }
      return { turtlePos: turtlePos, chunks: newChunks };

    case "chunk" /* Server Msg: { type: "chunk", value: { pos: [], data: [] } } */:
      const arrLoc = getArrayLocation(turtlePos, pos);
      if (arrLoc) {
        const updatedChunks = state.chunks.slice(0);
        updatedChunks[arrLoc] = new Chunk({ pos, data });
        return { ...state, chunks: updatedChunks };
      }
      return state;

    default:
      return new Error();
  }
}

function requestMissingChunks(
  turtleChunkPos: Coordinate,
  chunks: Chunk[],
  socket: WebSocket
) {
  for (let y = -1; y < 2; ++y) {
    for (let z = -1; z < 2; ++z) {
      for (let x = -1; x < 2; ++x) {
        const i = (y + 1) * 9 + (z + 1) * 3 + (x + 1);
        if (!chunks[i]) {
          const [tx, ty, tz] = turtleChunkPos;
          socket.send(
            JSON.stringify({
              type: "get",
              value: "chunk",
              pos: [tx + x, ty + y, tz + z],
            })
          );
        }
      }
    }
  }
}

function App() {
  const socket = useRef<WebSocket|undefined>(undefined)
  const [turtles, setTurtles] = useState<Turtle[]>([]);
  const [curr, setCurr] = useState<Turtle|undefined>(undefined);
  const [renderinfo, dispatch] = useReducer(reducer, EMPTY_RENDERINFO);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("Connection established");
      ws.send(JSON.stringify({ type: "get", value: "turtles" }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "full":
            setTurtles(msg.turtles);
            setCurr(
              curr && msg.turtles.find((t: Turtle) => t.id === curr.id)
            );
            break;

          case "hi":
            setTurtles((prevState) =>
              [
                ...prevState.filter((t) => t.id !== msg.turtle.id),
                msg.turtle,
              ].sort((a, b) => a.id - b.id)
            );
            break;

          case "bye":
            setTurtles((prevState) =>
              prevState.filter((t) => t.id !== msg.turtle.id)
            );
            if (curr && msg.turtle.id === curr.id) setCurr(undefined);
            break;

          case "fullchunkinfo":
            dispatch({ type: "full", value: msg.value });
            break;

          case "pos":
            dispatch({ type: "pos", value: msg.value });
            requestMissingChunks(
              renderinfo?.turtlePos,
              renderinfo?.chunks,
              ws
            );
            break;

          case "chunk":
            dispatch({ type: "chunk", value: msg.value });
            break;
        }
      } catch {}
    };

    socket.current = ws;

    return () => {
      ws.close();
      socket.current = undefined;
    };
  }, []);

  const currSelect = (turtle: Turtle) => {
    setCurr(turtle);
    socket.current!.send(JSON.stringify({ type: "subscribe", value: turtle }));
  };

  if (!socket.current) {
    return "Loading...";
  }
  return (
    <div className="App">
      <header>
        <div className="Logobox">
          <img className="App-logo" src={logo} alt="Logo" />
          Turtler
        </div>
        <nav>xd</nav>
      </header>
      <TurtleSelector turtles={turtles} curr={curr} onSelect={currSelect} />
      <main>
        {curr && 
        <>
          <Display renderinfo={renderinfo} />
          <ControlPanel />
        </>}
      </main>
    </div>
  );
}

export default App;
