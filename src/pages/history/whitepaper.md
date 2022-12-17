# Cavern Protocol WhitePaper[^3]

Abstract : This white paper is the first of a series of documents around Cavern Protocol and its vision for the future of accessible DeFi. This first document will delve into the details of the mechanisms behind Cavern Protocol and will detail how any Terra user can leverage it. Because our protocol is deeply rooted in a protocol that doesn't exist any more, we will need to briefly go over their mechanisms to be able to understand how Cavern works.


## The past

From early 2021, Anchor Protocol ruled Terra's blockchain in terms of TVL and user base. With an already impressive 9B$ TVL in early 2022[^1], an integration into 3 blockchains (Terra, Avalanche and Ethereum), Anchor was a model in terms of usability, mechanics and yield source for all kinds of users. 

Unfortunately, as we all know, Anchor is not usable since the UST de-peg. There are multiple reasons to that : 
1. UST doesn't have a fixed value anymore, rendering the principal of Anchor' mechanisms useless - People don't care about a medium-low APY on a coin that has no utility and is not stable anymore.. 
2. Luna is not swappable to UST directly anymore using the peg mechanism (burning Luna to get UST in exchange).
3. The ANC token, that was powering the platform, has lost most of its value.
4. The Luna (now LUNC) token lost most of its value (99.9%+), thus liquidating most borrowers and pushing them away from the platform. 

In this document, we won't go in the details of how Anchor worked because it is already detailed very precisely in their whitepaper, in their docs, as well as all over the internet (DYOR). However, we will come back on some parts of the mechanisms that we consider shouldn't belong into a product of that type and that we chose to change in Cavern Protocol.

## Our vision

### History

From September 2022, we started working on a fork of Anchor Protocol. This initiative was actually launched by a few developers that were eager to see the mechanisms re-implemented on Terra 2.0. They wanted to create a new version of Anchor that didn't include a utility token. However, when diving into the code, they realized that the ANC token (that is now down 99.92% down from its ATH) played a central role in the protocol. When removing it, and simulating its behavior, they realized the market was now really unstable, with borrowers reluctant to borrow, even when the deposit APR was very low. Anchor's mechanisms were more complex than they initially thought.

When they passed the code over to the Cavern team, they were discouraged and thought that reviving the protocol was a waste of time. We agreed with them on this idea that a revival of the protocol couldn't be possible without getting rid of unnecessary speculation. Let us explain this part, because this is central to the new mechanisms.

### New borrower incentives

Borrower today are not incentivized enough. Actually, the borrowing APR is directly linked to the utilization ratio using an affine function :

$ratio_{utilization} = \frac{Borrowed Capital}{Deposited Capital}$

$borrowerAPR = I_m*ratio_{utilization} + baseAPR$

From those two formula along with this little remark[^2], we can see that if at a fixed utilization of the deposited funds, the deposit APY is not met (there is not enough borrowers for example), there is no mechanism that incentives borrowers and helps the actual deposit APY to reach the target APY. 

In Anchor's protocol, some additional ANC tokens were minted to incentivize borrowers. As we don't want to incentivize borrowers with a token that bears more risk, is more volatile than the token they already hold (Luna), we got rid of this incentives mechanism along with the ANC token. 

In order to restore balance to the protocol towards the target APY, and to incentivize the borrowers more, we have decided to change the way staking rewards are distributed inside the protocol. 

In order to understand the following, you need to understand this schematics : 

Include SVG of : 
        1. Depositor deposits funds
        2. Borrower deposits collateral (that will get 15% APR)
        3. Borrower borrows some funds
        4. Depositor bets some yield (borrower price + staked Luna)


With this schematic, you may realize in the current mechanism, the borrowers don't get any staking rewards from depositing their Luna to borrow stable-coins. What we propose at Cavern is to redirect a part of the staking yield to the borrowers. This way, there is one more element in this market that can drive our deposit APY up, even when the utilization ratio is discouraging to borrowers. The staking yield will indeed incentivize the borrowers to deposit their funds because it will subsidize the price of their loan interests. 

The details of the parameters used and the exact mechanism won't be disclosed yet but they will be available shortly in the protocol's documentation. This protocol will be available off-chain in a usual doc environment, but will also be put on-chain, in order to preserve it and make it accessible to anyone, even if centralized actors default (such as the CavernProtocol for instance).

## The near future

We are looking for a decentralized future. We want the Cavern protocol to become a fully decentralized entity running on decentralized infrastructure and not relying on centralized pain-points. The first step will be the open-sourcing of all our code-base. This will be done simultaneously to the launch of the platform, to prevent front-running. The next steps are being written as we speak because total decentralization is not possible right away. Here are the few points of centralization the protocol still has.

### Contract ownership

Today, contracts are owned by a centralized entity known as CavernPerson. This person runs all of Cavern's contracts and has ownership over them. They can change every parameter, destroy every piece of logic that exists in the protocol and even migrate the contracts to siphon the funds of the protocol. This is pretty bad. Even if CavernPerson is a good person, no protocol in their right mind could operate like this. In the near future (right before launch), CavernPerson will team up with a few people in the Terra space (some people you may know, others you might not), in order to remove that 1 person centralization pain-point. 

### Price Oracle

Liquidations are a pretty sensitive part of Cavern Protocol. Those liquidations rely on the exact knowledge of what a collateral is worth. However, as Terra doesn't have a decentralized oracle for now (but it may come one day, some actors have already put some oracles in place across Cosmos and IBC), we can't rely on a on-chain data. We therefore need to rely on an external price oracle to execute liquidations. This is done today using a centralized server that queries the price of Luna and feeds it into the contract. This oracle is run by one person and here again, it's a pain point to the protocol.

### Epoch Operations

The money market runs on smart-contracts. Those contracts are not self-aware but their state still need to be updated every now and then. Those operations (usually done every 3 hours in the protocol) however are quite costly. As of right now an operations costs 0.03 luna (~5cts). Even if this price seems low, it's way higher than any user operation, and as is, we can't reward users for following the availability and executing those functions. Furthermore, these functions should be called as much as possible to keep the money market secure. So even if those functions are available for everyone, we make sure they are called every 3 hours, as they should be. This part isn't about a point where on needs centralization, it's about control. There is no incentives yet to call this function and therefore, nobody but the protocol can be expected to run them regularly.

### Front-end Operations

When launching the platform, only our hosted WebApp will be available easily to interact with the contracts. So if our server goes down, most of the people (the more Dev-averse), won't be able to interact with the contracts and interactions will be more difficult for all. As we can't rely on that, we will open-source our front-end, right after we launch the protocol. We want to set and follow that standard of open-sourcing as much as possible to allow for decentralization. As a general comment to other blockchain protocols, we believe open-sourcing should be part of all protocols roadmaps. Today, the website is hosted on the IPFS. The next step would be to put up the website on a decentralized hosting platform, with decentralized rights over the changes made to the code.

### Cavern Protocol fees

As stated in 

### Other ecosystems

Despite Anchor's presence across 3 ecosystems, the majority of the collateral deposited came in a great majority from Terra Classic Native token, the Luna[^1]. Cavern Protocol will therefore focus primarly on Terra 2.0. Extending to other collaterals and markets will be a secondary focus of the protocol. The first focus being shipping a great product that the community needs right now.  


## Risks to consider

As stated above, one of the mechanisms that allowed Anchor to thrive was the possibility to burn Luna to mint UST. This mechanism was very convenient for both the protocol and UST. In order to understand that, let's step-back a little. 

The way Anchor Protocol worked and the way Cavern Protocol works today is by distributing staking rewards (Luna only for Cavern Protocol so far) to stable-coin depositors directly in this stable-coin denomination. You see that the protocol actually relies *heavily* on Luna to stable-coin swaps. Back on Terra Classic, this was very beneficial to Luna holders. Indeed, every 3 hours, the protocol was burning Luna, thus reducing the total Luna supply and avoiding the negative price-effect a token dump can have. Anchor mechanism was beneficial to the whole ecosystem, by increasing Luna's value and increasing UST usage. 

This mechanism unfortunately doesn't exist on Terra 2.0. The protocol therefore relies on regular token swaps through multiple pools across the Terra ecosystem (Astroport, Terraswap and Phoenix Finance). Those swaps made regularly will have a slight effect on price, creating a *little* sell pressure. This is unavoidable in todays operation state, because the whole model relies on the fact that the deposit yield is paid in stablecoin equivalents. 

However, we have 2 things to add to this fact : 

1. The protocol will **regularly** swap Luna to a stable-coin, meaning that there won't be any radical sellout event.
2. Cavern operates just like a validator would operate, selling their Luna rewards when they need to finance their operation. What we are doing is actually using the Tendermint mechanisms to boost on-chain applications and usage.

## Closing statment

Cavern Protocol is building a decentralized platform on top of existing software. We believe the decentralization effort is necessary but we also know that it is impossible to launch a totally decentralized platform right away. An adjustment and adoption period are however needed to build trust into the protocol and find the best way to bring this product to the community. Terra 2.0 belongs to the community and we see Cavern Protocol be passed over to the community very shortly after its launch.


[^3]: This file was uploaded on Terra's blockchain `phoenix-1` main-net at address `Cavern Protocol Documents NFT`. All subsequent documents issued by Cavern Protocol will be located or linked from this address. 
[^1]: See [DefiLlama for more details](https://defillama.com/protocol/anchor)
[^2]: We have to keep in mind that, the higher the utilization ratio, the higher the actual deposit APR.