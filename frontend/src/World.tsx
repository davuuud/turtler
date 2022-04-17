import { useRef, useState } from "react";
import { useFrame } from '@react-three/fiber';

function Block(props: any) {
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
            <Block position={[1, 0, 0]} />
            <Block position={[-1, 0, 0]} />
        </>
    )
}

type Faces = { 
    dir: number[];
    corners: number[][];
}

class VoxelWorld {
    static faces: Faces[];
    static cellLen = 16;
    static cellSlice = 256;
    static cellSize = 4096
    cells: Uint8Array[][][];

    constructor() {
        this.cells = [[[]]]
        this.cells[0][0][0] = new Uint8Array(VoxelWorld.cellSize);
    }
    
    calcVoxelOffset(x: number, y: number, z: number) {
        const voxelX = x >> 4;
        const voxelY = y >> 4;
        const voxelZ = z >> 4;

        return voxelY * VoxelWorld.cellSlice + voxelZ * VoxelWorld.cellLen + voxelX;
    }

    getVoxel(x: number, y: number, z: number) {
        const cell = this.cells[x][y][z];
        if (!cell) return 0;
        return cell[this.calcVoxelOffset(x, y, z)];
    }

    setVoxel(x: number, y: number, z: number, v: number) {
        let cell = this.cells[x][y][z];
        if (!cell) {
            cell = new Uint8Array(VoxelWorld.cellSize)
            this.cells[x][y][z] = cell;
        }

        cell[this.calcVoxelOffset(x, y, z)] = v;
    }

    genGeometryDataForCell(cellX: number, cellY: number, cellZ: number) {
        const cellSize = VoxelWorld.cellLen;
        const positions = [];
        const normals = [];
        const indices = [];
        const startX = cellX * cellSize;
        const startY = cellY * cellSize;
        const startZ = cellZ * cellSize;

        for (let y = 0; y < cellSize; y++) {
            const voxelY = startY + y;
            for (let z = 0; z < cellSize; z++) {
                const voxelZ = startZ + z;
                for (let x = 0; x < cellSize; x++) {
                    const voxelX = startX + x;
                    const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
                    if (voxel) {
                        for (const { dir, corners } of VoxelWorld.faces) {
                            const neighbor = this.getVoxel(voxelX + dir[0], voxelY + dir[1], voxelZ + dir[2]);
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

VoxelWorld.faces = [
    {   // left
        dir: [-1,  0,  0],
        corners: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
            [0, 1, 1],
        ],
    }, 
    {   // right
        dir: [ 1,  0,  0],
        corners: [
            [1, 0, 0],
            [1, 1, 0],
            [1, 0, 1],
            [1, 1, 1],
        ],
    }, 
    {   // down
        dir: [ 0, -1,  0],
        corners: [
            [0, 0, 0],
            [1, 0, 0],
            [0, 0, 1],
            [1, 0, 1],
        ],
    },
    {   // up
        dir: [ 0,  1,  0],
        corners: [
            [0, 1, 0],
            [0, 1, 1],
            [1, 1, 0],
            [1, 1, 1],
        ],
    },
    {   // back
        dir: [ 0,  0, -1],
        corners: [
            [0, 0, 0],
            [0, 1, 0],
            [1, 0, 0],
            [1, 1, 0],
        ],
    },
    {   // front
        dir: [ 0,  0,  1],
        corners: [
            [0, 0, 1],
            [1, 0, 1],
            [0, 1, 1],
            [1, 1, 1],
        ],
    },
];

export default World;