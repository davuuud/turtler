type Face = { dir: number[], corners: number[][] }
type Block = "grass" | "dirt" | "stone"
type Coordinate = [x: number, y: number, z: number];
type ChunkUpdate = { pos: Coordinate, data: [{ x: number, y: number, z: number, type: Block }] }

function getBlockId(block: Block) {
  switch (block) {
    case "grass":
      return 1;
    case "dirt":
      return 2;
    case "stone":
      return 3;
    default:
      return 0;
  }
}

class Chunk {
  static chunkLen   = 16;
  static chunkSlice = 256;
  static chunkSize  = 4096;
  static faces: Face[];
  pos: Coordinate;
  chunk: Uint8Array;

  constructor ({ pos, data }: ChunkUpdate) {
    this.pos = pos;
    this.chunk = new Uint8Array(Chunk.chunkSize);
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
      voxelY * Chunk.chunkSlice + voxelZ * Chunk.chunkLen + voxelX;
    return voxelOffset;
  }

  voxelInChunk(x: number, y: number, z: number) {
    const [px, py, pz] = this.pos;
    return (x >> 4) === px && (y >> 4) === py && (z >> 4) === pz;
  }

  getVoxel(x: number, y: number, z: number) {
    if (!this.voxelInChunk(x, y, z)) return 0;
    return this.chunk[this.calcVoxelOffset(x, y, z)];
  }

  setVoxel(x: number, y: number, z: number, v: Block) {
    const blockId = getBlockId(v);
    this.chunk[this.calcVoxelOffset(x, y, z)] = blockId;
  }

  calcChunkGeometryData() {
    const cellSize = Chunk.chunkLen;
    const positions = [];
    const normals = [];
    const indices = [];
    const [px, py, pz] = this.pos;
    const startX = px * cellSize;
    const startY = py * cellSize;
    const startZ = pz * cellSize;

    for (let y = 0; y < cellSize; y++) {
      const voxelY = startY + y;
      for (let z = 0; z < cellSize; z++) {
        const voxelZ = startZ + z;
        for (let x = 0; x < cellSize; x++) {
          const voxelX = startX + x;
          const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
          if (voxel) {
            for (const { dir, corners } of Chunk.faces) {
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

Chunk.faces = [
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

export default Chunk;
