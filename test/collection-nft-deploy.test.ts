import { CreateAccountOutput, WalletTypes } from "locklift/types/index";
import { Address, Contract, Signer, zeroAddress } from "locklift";
import { ContractData } from "locklift/internal/factory/index";
import { FactorySource } from "../build/factorySource";
import { expect } from "chai";
import { json } from "stream/consumers";

describe("should deploy the collection and Nft contracts , and return the revelant data", async function () {
  let WalletV3: CreateAccountOutput;
  var signer: Signer;
  var CollectionCon: Contract<FactorySource["RevoltNftCollection"]>;
  var RevoltNftArt: ContractData<FactorySource["RevoltNft"]>;
  var IndexArt: ContractData<FactorySource["Index"]>;
  var IndexBasisArt: ContractData<FactorySource["IndexBasis"]>;
  var collectionAddr: Address;
  var metadata: string;
  before(async function () {
    signer = (await locklift.keystore.getSigner("0"))!;
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
    metadata = JSON.stringify({
      type: "Basic NFT",
      name: "Revolt NFT",
      description: "bad ass nft collection",
      preview: {
        source:
          "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGljfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
        mimetype: "image/png",
      },
      files: [
        {
          source:
            "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGljfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
          mimetype: "image/png",
        },
      ],
      external_url: "https://nft.venom",
    });
  });
  it("should deploy Collection contract and return valid json", async function () {
    const { contract: Collection } = await locklift.factory.deployContract({
      contract: "RevoltNftCollection",
      publicKey: signer.publicKey,
      initParams: {},
      constructorParams: {
        codeIndex: IndexArt.code,
        codeIndexBasis: IndexBasisArt.code,
        codeNft: RevoltNftArt.code,
        json: metadata,
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
    expect(jsonReturned).to.not.eq("");
    // setting the state varible
    collectionAddr = Collection.address;
  });
  it("should deploy the Nft Contract and return the revelant json and data  ", async function () {
    // fetching the Collectoin contract
    const Collection = await locklift.factory.getDeployedContract(
      "RevoltNftCollection",
      collectionAddr
    );
    const { traceTree: data } = await locklift.tracing.trace(
      Collection.methods.mint({ _json: "fuck off bitch" }).send({
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
    const NftAddr: Address = (
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
      "fuck off bitch"
    );
  });
});
