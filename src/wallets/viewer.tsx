import Connector from "@walletconnect/core"
import {
    ConnectResponse,
    Wallet,
} from "@terra-money/wallet-interface"
import { CreateTxOptions } from "@terra-money/feather.js"
import { MAINNET } from "@anchor-protocol/app-provider"

export enum EventTypes {
    NetworkChange = "networkChange",
    WalletChange = "walletChange",
    Disconnect = "disconnect",
    Connect = "connect",
    Connected = "connected"
}

const LOCAL_STORAGE_KEY = "CAVERN_ADDRESS_VIEWER";

export default class AddressViewerWallet implements Wallet {
    private _address: string | undefined = undefined
    private _connector: Connector | null = null
    private _connected = false;
    private _listener: Record<string, () => void[]> = {};
    private _justCreated: boolean;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {
        this._justCreated = true;
    }

    async info() {
        return {
            [MAINNET.chainID]: MAINNET
        }
    }
    close(address: string | undefined) {
        this._address = address;
        if (address) {
            localStorage.setItem(LOCAL_STORAGE_KEY, address)
        }
        this._triggerListener(EventTypes.Connected, { address });
        console.log("Closing", address)
    }

    async connect() {
        // if (this._justCreated) {
        //     this._justCreated = false;
        //     return {
        //         addresses: {},
        //     }
        // }
        if (this._address) {
            return {
                addresses: {
                    [MAINNET.chainID]: this._address,
                },
                id: this.id
            }
        }
        const localAddress = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localAddress) {
            return {
                addresses: {
                    [MAINNET.chainID]: localAddress,
                },
                id: this.id
            }
        }

        // We notify the listeners that an connect event has triggered
        this._triggerListener(EventTypes.Connect, {});

        // This returns once they are done
        return new Promise<ConnectResponse & { id?: string }>((resolve, reject) => {
            this.addListener(EventTypes.Connected, (data: { address: string | null }) => {
                if (!data.address) {
                    resolve({ addresses: {} })
                } else {
                    resolve({
                        addresses: {
                            [MAINNET.chainID]: data.address,
                        },
                        id: this.id
                    })
                }
            })
        })
    }

    async disconnect() {
        this._address = undefined
        localStorage.removeItem(LOCAL_STORAGE_KEY)
    }

    async post(tx: CreateTxOptions) {

        throw "You can't submit a transaction using the Address viewer"
        return {} as any
    }

    async sign(_: CreateTxOptions) {
        throw "You can't submit a transaction using the Address viewer"
        return {} as any
    }

    private _listeners: Record<string, ((e: any) => void)[]> = {}

    addListener(event: EventTypes, cb: (data: any) => void) {
        this._listeners[event] = [...(this._listeners[event] ?? []), cb]
    }

    removeListener(event: EventTypes, cb?: (data: any) => void) {
        this._listeners[event]?.filter((callback) => cb !== callback)
    }

    private _triggerListener(event: EventTypes, data: any) {
        console.log(this._listeners)
        this._listeners[event]?.forEach((cb) => cb(data))
    }

    isInstalled = true

    id = "cavern-address-viewer"

    details = {
        name: "Address Viewer",
        icon: "https://cavernprotocol.com/logo.png",
        website: "https://cavernprotocol.com",
    }
}