import { useRef, useState } from "react";
import { useFrame } from '@react-three/fiber';

function Chunk(props: any) {
    const ref = useRef()
    
    return (
        <mesh {...props} ref={ref} scale={1}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color='hotpink' />
        </mesh>
    )
}

function World(props: any) {
  
  // props.requestChunk({x: 0, y: 0, z: 0});
  
  return (
    <>
      <Chunk position={[1, 0, 0]} />
      <Chunk position={[-1, 0, 0]} />
    </>
  )
}

type Face = { dir: number[], corners: number[][] }
type Block = "grass" | "dirt" | "stone"
type ChunkUpdate = { coords: { x: number, y: number, z: number }, data: [{ x: number, y: number, z: number, type: Block }] }

class Subchunk {
  static chunkLen   = 16;
  static chunkSlice = 256;
  static chunkSize  = 4096;
  static faces: Face[];
  x: number;
  y: number;
  z: number;
  chunk: Uint8Array;

  constructor ({ coords, data }: ChunkUpdate) {
    this.x = coords.x;
    this.y = coords.y;
    this.z = coords.z;
    this.chunk = new Uint8Array(Subchunk.chunkSize);
    for (let block of data) {
      const { x, y, z, type } = block;
      this.setVoxel(x, y, z, type);
    }
  }

  calcVoxelOffset(x: number, y: number, z: number) {
    const voxelX = x & 0xf;
    const voxelY = y & 0xf;
    const voxelZ = z & 0xf;
    const voxelOffset =
      voxelY * Subchunk.chunkSlice + voxelZ * Subchunk.chunkLen + voxelX;
    return voxelOffset;
  }

  voxelInChunk(x: number, y: number, z: number) {
    return (x >> 4) === this.x && (y >> 4) === this.y && (z >> 4) === this.z;
  }

  getVoxel(x: number, y: number, z: number) {
    if (!this.voxelInChunk(x, y, z)) return 0;
    return this.chunk[this.calcVoxelOffset(x, y, z)];
  }

  setVoxel(x: number, y: number, z: number, v) {
    this.chunk[this.calcVoxelOffset(x, y, z)] = v;
  }

  calcChunkGeometryData() {
    const cellSize = Subchunk.chunkLen;
    const positions = [];
    const normals = [];
    const indices = [];
    const startX = this.x * cellSize;
    const startY = this.y * cellSize;
    const startZ = this.z * cellSize;

    for (let y = 0; y < cellSize; y++) {
      const voxelY = startY + y;
      for (let z = 0; z < cellSize; z++) {
        const voxelZ = startZ + z;
        for (let x = 0; x < cellSize; x++) {
          const voxelX = startX + x;
          const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
          if (voxel) {
            for (const { dir, corners } of Subchunk.faces) {
              const neighbor = this.getVoxel(
                voxelX + dir[0],
                voxelY + dir[1],
                voxelZ + dir[2]
              );
              if (!neighbor) {
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }
    return { positions, normals, indices };
  }
}

Subchunk.faces = [
  {
    // left
    dir: [-1, 0, 0],
    corners: [
      [0, 1, 0],
      [0, 0, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    // right
    dir: [1, 0, 0],
    corners: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
  {
    // bottom
    dir: [0, -1, 0],
    corners: [
      [1, 0, 1],
      [0, 0, 1],
      [1, 0, 0],
      [0, 0, 0],
    ],
  },
  {
    // top
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
  {
    // back
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    // front
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ],
  },
];

export default World;