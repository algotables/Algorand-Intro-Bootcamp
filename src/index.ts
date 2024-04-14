import * as algokit from '@algorandfoundation/algokit-utils';

async function main() {
    const algorand = algokit.AlgorandClient.defaultLocalNet()

    // ===== Create two accounts =====
    const alice = algorand.account.random()
    const bob = algorand.account.random()
    
    console.log("Alice's Address", alice.addr)

    // ===== Get information about alice from algod =====
    console.log("Alice's Account", await algorand.account.getInformation(alice.addr))

    // ===== Get some ALGO into alice's account =====
    const dispenser = await algorand.account.dispenser()

    await algorand.send.payment({
        sender: dispenser.addr,
        receiver: alice.addr,
        amount: algokit.algos(10)
    })

    // See new balance
    console.log("Alice's account", await algorand.account.getInformation(alice.addr))

    // ===== Create the ASA. ASA === Algorand Standard Asset =====
    const createResult = await algorand.send.assetCreate({
        sender: alice.addr,
        total: 100n,

    })

    // Get assetIndex from transaction
    const assetId = BigInt(createResult.confirmation.assetIndex!)
    console.log('assetId', assetId)

    // ===== Fund Bob =====
    await algorand.send.payment({
        sender: dispenser.addr,
        receiver: bob.addr,
        amount: algokit.algos(10)

    })
    
    console.log("Bob's MBR pre opt-in", (await algorand.account.getInformation(bob.addr)).minBalance)

    // ===== Opt-in Bob to the ASA and try transfer again =====
    await algorand.send.assetOptIn({
        sender: bob.addr,
        assetId

    })

    console.log("Bob's MBR post opt-in", (await algorand.account.getInformation(bob.addr)).minBalance)

    await algorand.send.assetTransfer({
        sender: alice.addr,
        receiver: bob.addr,
        amount: 2n,
        assetId
    })

    console.log("Alice's Asset Balance", await algorand.account.getAssetInformation(alice.addr, assetId))
    console.log("Bob's Asset Balance", await algorand.account.getAssetInformation(bob.addr, assetId))

    // ==== Alice buys back ASA from Bob ====

    await algorand.newGroup().addPayment({
        sender: alice.addr,
        receiver: bob.addr,
        amount: algokit.algos(1)
    }).addAssetTransfer({
        sender: bob.addr,
        receiver: alice.addr,
        assetId,
        amount: 1n
    }).execute()

    console.log("Alice's Asset Balance", await algorand.account.getAssetInformation(alice.addr, assetId))
    console.log("Bob's Asset Balance", await algorand.account.getAssetInformation(bob.addr, assetId))
    console.log("Bob's MBR post transfer", (await algorand.account.getInformation(bob.addr)).minBalance)

    // ==== Bob Close out the ASA ====
    await algorand.send.assetTransfer({
        sender: bob.addr,
        receiver: alice.addr,
        assetId,
        amount: 0n,
        closeAssetTo: alice.addr
    })

    console.log("Alice's Asset Balance", await algorand.account.getAssetInformation(alice.addr, assetId))
    console.log("Bob's MBR opt-out", (await algorand.account.getInformation(bob.addr)).minBalance)    

}

main();