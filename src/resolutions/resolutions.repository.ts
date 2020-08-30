import { EntityRepository, Repository } from "typeorm";
import { Resolution } from "src/entities/resolution.entity";


@EntityRepository(Resolution)
export class ResolutionRepository extends Repository<Resolution>
{

}