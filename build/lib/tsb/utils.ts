/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export namespace strings {

			return String(rest[index]) || match;
		});
	}
}

export namespace graph {

    export class Node<T> {

        readonly incoming = new Map<T, Node<T>>();
        readonly outgoing = new Map<T, Node<T>>();

        constructor(readonly data: T) {

        }
    }

	export function newNode<T>(data: T): Node<T> {
		return {
			data: data,
			incoming: {},
			outgoing: {},
		};
	}

        private _nodes = new Map<T, Node<T>>();

			this._traverse(startNode, inwards, {}, callback);
		}

            fromNode.outgoing.set(toNode.data, toNode);
            toNode.incoming.set(fromNode.data, fromNode);
        }

        resetNode(data: T): void {
            const node = this._nodes.get(data);
            if (!node) {
                return;
            }
            for (const outDep of node.outgoing.values()) {
                outDep.incoming.delete(node.data);
            }
            node.outgoing.clear();
        }

        lookupOrInsertNode(data: T): Node<T> {
            let node = this._nodes.get(data);

            if (!node) {
                node = new Node(data);
                this._nodes.set(data, node);
            }

			const nodes = inwards ? node.outgoing : node.incoming;

        lookup(data: T): Node<T> | null {
            return this._nodes.get(data) ?? null;
        }

        findCycle(): T[] | undefined {

            let result: T[] | undefined;
            let foundStartNodes = false;
            const checked = new Set<Node<T>>();

            for (const [_start, value] of this._nodes) {

                if (Object.values(value.incoming).length > 0) {
                    continue;
                }

                foundStartNodes = true;

                const dfs = (node: Node<T>, visited: Set<Node<T>>) => {

                    if (checked.has(node)) {
                        return;
                    }

                    if (visited.has(node)) {
                        result = [...visited, node].map(n => n.data);
                        const idx = result.indexOf(node.data);
                        result = result.slice(idx);
                        return;
                    }
                    visited.add(node);
                    for (const child of Object.values(node.outgoing)) {
                        dfs(child, visited);
                        if (result) {
                            break;
                        }
                    }
                    visited.delete(node);
                    checked.add(node);
                };
                dfs(value, new Set());
                if (result) {
                    break;
                }
            }

            if (!foundStartNodes) {
                // everything is a cycle
                return Array.from(this._nodes.keys());
            }

            return result;
        }
    }

		inertEdge(from: T, to: T): void {
			const fromNode = this.lookupOrInsertNode(from);

			const toNode = this.lookupOrInsertNode(to);

			fromNode.outgoing[this._hashFn(to)] = toNode;

			toNode.incoming[this._hashFn(from)] = fromNode;
		}

		removeNode(data: T): void {
			const key = this._hashFn(data);

			delete this._nodes[key];

			collections.forEach(this._nodes, (entry) => {
				delete entry.value.outgoing[key];

				delete entry.value.incoming[key];
			});
		}

		lookupOrInsertNode(data: T): Node<T> {
			const key = this._hashFn(data);

			let node = collections.lookup(this._nodes, key);

			if (!node) {
				node = newNode(data);

				this._nodes[key] = node;
			}

			return node;
		}

		lookup(data: T): Node<T> | null {
			return collections.lookup(this._nodes, this._hashFn(data));
		}
	}
}
