import { CreateAccountOutput, WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { ContractData } from "locklift/internal/factory/index";
import { FactorySource } from "../build/factorySource";
import { expect } from "chai";
import fs from "fs";
describe("should deploy the collection and Nft contracts , and return the revelant data", async function () {
  let WalletV3: CreateAccountOutput;
  let WalletV3_2: CreateAccountOutput;
  var signer: Signer;
  var signer2: Signer;
  var CollectionCon: Contract<FactorySource["RevoltNftCollection"]>;
  var RevoltNftArt: ContractData<FactorySource["RevoltNft"]>;
  var IndexArt: ContractData<FactorySource["Index"]>;
  var IndexBasisArt: ContractData<FactorySource["IndexBasis"]>;
  var collectionAddr: Address;
  var NftAddr: Address;
  before(async function () {
    signer = (await locklift.keystore.getSigner("0"))!;
    signer2 = (await locklift.keystore.getSigner("1"))!;
    RevoltNftArt = locklift.factory.getContractArtifacts("RevoltNft");
    IndexArt = locklift.factory.getContractArtifacts("Index");
    IndexBasisArt = locklift.factory.getContractArtifacts("IndexBasis");
    WalletV3 = await locklift.factory.accounts.addNewAccount({
      type: WalletTypes.WalletV3, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
      //Value which will send to the new account from a giver
      value: locklift.utils.toNano(100),
      //owner publicKey
      publicKey: signer.publicKey,
    });
    console.log("wallet : ", WalletV3.account.address.toString());
    WalletV3_2 = await locklift.factory.accounts.addNewAccount({
      type: WalletTypes.WalletV3, // or WalletTypes.HighLoadWallet or WalletTypes.WalletV3,
      //Value which will send to the new account from a giver
      value: locklift.utils.toNano(100),
      //owner publicKey
      publicKey: signer2.publicKey,
    });
    console.log("wallet 2: ", WalletV3_2.account.address.toString());
  });
  let example_collection_metadata: string = fs.readFileSync(
    "./metadata/Collection_metadata.json",
    "utf-8"
  );
  it("should deploy Collection contract and return valid json", async function () {
    const { contract: Collection } = await locklift.factory.deployContract({
      contract: "RevoltNftCollection",
      publicKey: signer.publicKey,
      initParams: {},
      constructorParams: {
        codeIndex: IndexArt.code,
        codeIndexBasis: IndexBasisArt.code,
        codeNft: RevoltNftArt.code,
        json: example_collection_metadata,
      },
      value: locklift.utils.toNano(3),
    });
    CollectionCon = Collection;
    console.log(`collection : ${Collection.address.toString()}`);
    const jsonReturned = (
      await Collection.methods
        .getJson({
          answerId: 0,
        })
        .call({})
    ).json;
    expect(jsonReturned).to.eq(example_collection_metadata);
    // setting the state varible
    collectionAddr = Collection.address;
  });
  it("should deploy the Nft Contract and return the revelant json and data  ", async function () {
    // fetching the Collectoin contract
    const Collection = await locklift.factory.getDeployedContract(
      "RevoltNftCollection",
      collectionAddr
    );
    let example_agent_metadata: string = fs.readFileSync(
      "./metadata/agents_metadata/1.json",
      "utf-8"
    );
    const { traceTree: data } = await locklift.tracing.trace(
      Collection.methods.mint({ _json: example_agent_metadata }).send({
        from: WalletV3.account.address,
        amount: locklift.utils.toNano(5),
      })
    );
    const idEvent = data?.findEventsForContract({
      contract: CollectionCon,
      name: "NftCreated" as const,
    });
    console.log("this is Nft Id >>", idEvent![0].id);
    const nftid = idEvent![0].id;
    NftAddr = (
      await Collection.methods.nftAddress({ answerId: 0, id: nftid }).call({})
    ).nft;
    console.log(`NftAddr : ${NftAddr.toString()}`);
    // fetching the nft contract
    const NftCon = await locklift.factory.getDeployedContract(
      "RevoltNft",
      NftAddr
    );
    expect(
      (await NftCon.methods.getInfo({ answerId: 0 }).call({})).owner.toString()
    ).to.eq(WalletV3.account.address.toString());
    expect((await NftCon.methods.getJson({ answerId: 0 }).call({})).json).to.eq(
      example_agent_metadata
    );
  });
  it("should transfer the nft to seconod signer ", async function () {
    // fetching the nft contract
    const NftCon = await locklift.factory.getDeployedContract(
      "RevoltNft",
      NftAddr
    );
    await locklift.tracing.trace(
      NftCon.methods
        .transfer({
          to: WalletV3_2.account.address,
          sendGasTo: WalletV3.account.address,
          callbacks: [],
        })
        .send({
          from: WalletV3.account.address,
          amount: locklift.utils.toNano(1),
        })
    );
    console.log((await NftCon.methods.getInfo({ answerId: 0 }).call({})).owner);
  });
});
