
export namespace nameservice {
  export namespace nameserviceContract {
  	export interface OwnerOf{
  		owner_of:{
  			token_id: string
  		}
  	}

  	export interface OwnerOfResponse{
  		owner: string,
  		approvals: string[]
  	}

  	export interface NftInfo{
  		nft_info: {
			token_id: string
		}
  	}


	export interface NftInfoResponse {
		extension: Metadata
		tokenUri?: string | null
		[k: string]: unknown
	}

  	export interface ReverseRecords{
  		reverse_records: {
			addresses: string[],
		},
  	}

  	export interface ReverseRecordsResponse {
		records: ReverseRecordsItemResponse[]
		[k: string]: unknown
	}

  }
}

export interface ReverseRecordsItemResponse {
	address: string
	record?: OneReverseRecordResponse | null
	[k: string]: unknown
}

	export interface OneReverseRecordResponse {
	name: string
	token_id: string
	[k: string]: unknown
}

export interface Metadata {
	contractAddress?: string | null
	discord?: string | null
	email?: string | null
	externalUrl?: string | null
	github?: string | null
	image?: string | null
	imageData?: Logo | null
	name?: string | null
	parentTokenId?: string | null
	pgpPublicKey?: string | null
	publicBio?: string | null
	publicName?: string | null
	telegram?: string | null
	twitter?: string | null
	[k: string]: unknown
}

export type Binary = string
export type EmbeddedLogo =
	| {
			svg: Binary
	  }
	| {
			png: Binary
	  }

export type Logo =
	| {
			url: string
	  }
	| {
			embedded: EmbeddedLogo
	  }