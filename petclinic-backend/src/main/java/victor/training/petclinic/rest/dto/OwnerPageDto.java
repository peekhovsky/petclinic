package victor.training.petclinic.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "One page of owners")
public class OwnerPageDto {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<OwnerDto> content = new ArrayList<>();

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "Owners matching the search, over all pages")
    private long totalElements;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "Zero-based page index")
    private int page;

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "Requested rows per page")
    private int size;

    public List<OwnerDto> getContent() {
        return content;
    }

    public OwnerPageDto setContent(List<OwnerDto> content) {
        this.content = content;
        return this;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public OwnerPageDto setTotalElements(long totalElements) {
        this.totalElements = totalElements;
        return this;
    }

    public int getPage() {
        return page;
    }

    public OwnerPageDto setPage(int page) {
        this.page = page;
        return this;
    }

    public int getSize() {
        return size;
    }

    public OwnerPageDto setSize(int size) {
        this.size = size;
        return this;
    }
}
