import { Service } from "typedi";
import { TagCreateDTO } from "./dtos/tag-create.dto";
import Tags from "./tag.model";
import { Errors } from "../../helpers/handle-errors";
import { TagResponseDTO } from "./dtos/tag-response.dto";

@Service()
export class TagService {
  public createTag = async (tagParam: TagCreateDTO) => {
    const checkTag = await Tags.findOne({ _tag: tagParam._tag });

    if (checkTag) throw Errors.TagDuplicated;

    const tag = await Tags.create(tagParam);

    return TagResponseDTO.toResponse(tag);
  };

  public getAllTags = async () => {
    const tags = await Tags.find({});

    return TagResponseDTO.toResponse(tags);
  };
}
