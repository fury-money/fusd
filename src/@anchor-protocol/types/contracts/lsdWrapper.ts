import { Rate } from "@libs/types";


export namespace lsdWrapper{
	export namespace underlyingHub {
	    export interface State { }
	    export interface StateResponse { exchange_rate: Rate }
	}
}
