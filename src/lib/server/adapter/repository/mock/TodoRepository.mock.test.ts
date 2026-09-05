import { TodoRepositoryMock } from "./TodoRepository.mock";
import { repositoryContract } from "../../../../../../tests/repository-contract";

repositoryContract("TodoRepositoryMock", async () => ({
  repository: new TodoRepositoryMock(), ownerId: "owner", otherId: "other",
}));
